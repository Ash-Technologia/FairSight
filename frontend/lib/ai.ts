import { GoogleGenerativeAI } from '@google/generative-ai'

// ─────────────────────────────────────────────
// MISTRAL AI (Free Tier — mistral.ai)
// Model: mistral-small-latest (free tier as of 2025)
// Signup: https://console.mistral.ai/
// ─────────────────────────────────────────────
export async function askMistral(prompt: string): Promise<any> {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) throw new Error('Missing MISTRAL_API_KEY')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only AI. You output valid JSON objects and nothing else. No markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Mistral ${res.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Mistral response')
    return parseVerdictResponse(content)
  } finally {
    clearTimeout(timeoutId)
  }
}


export const FAIRSIGHT_VERDICT_SYSTEM_PROMPT = `You are FairSight, an expert AI fairness auditor.
Analyze the provided statistical metrics, feature importance, and flip test results to determine if a dataset contains bias.
Your task is to synthesize these numbers into a human-readable diagnosis and actionable mitigation strategy.

DO NOT use markdown backticks in your response. Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Detailed 2-3 sentence overview of the bias analysis.",
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAR",
  "root_cause": "The likely source of the bias based on proxy features and disparities.",
  "affected_groups": ["List", "of", "groups", "experiencing", "disadvantage"],
  "mitigations": [
    {
      "title": "Short title of mitigation",
      "description": "Detailed explanation of what to do",
      "difficulty": "Easy" | "Medium" | "Hard",
      "expected_improvement": "Short string of expected stat change"
    }
  ],
  "board_summary": "One-sentence executive summary suitable for a board of directors."
}`

export function buildVerdictUserPrompt(metrics: any, filename: string): string {
  const byAttr = metrics.by_attribute || {}
  const attrSummaries = Object.entries(byAttr).map(([attr, vals]: [string, any]) => ({
    attribute: attr,
    demographic_parity: vals.demographic_parity,
    equalized_odds: vals.equalized_odds,
    max_disparity: vals.max_group_disparity,
    approval_rates: vals.approval_rates,
    is_biased: vals.is_biased,
  }))

  return `Dataset: "${filename}"
Fairness Score: ${metrics.fairness_score ?? 'N/A'}/100
Overall Verdict: ${metrics.overall_verdict ?? 'N/A'}
Bias Severity: ${metrics.bias_severity ?? 'N/A'}
Row Count: ${metrics.row_count ?? 'N/A'}
Protected Attributes: ${JSON.stringify(attrSummaries, null, 2)}
Proxy Features: ${JSON.stringify(metrics.feature_importance?.proxy_features ?? [])}
Root Cause Hint: ${metrics.feature_importance?.root_cause ?? 'N/A'}
Flip Rate: ${metrics.flip_test?.overall_flip_rate ?? 'N/A'}

Respond with ONLY the JSON verdict object, no other text.`
}

// FIX 2: Robust parser — tries direct parse first, then healing, then regex extraction
export function parseVerdictResponse(rawText: string): any {
  if (!rawText) throw new Error('Empty response')

  const repairJson = (text: string) => {
    return text
      .replace(/,\s*([\}\]])/g, '$1') // Remove trailing commas
      .replace(/(\r\n|\n|\r)/gm, ' ') // Flatten newlines
      .trim()
  }

  try {
    return JSON.parse(rawText.trim())
  } catch {
    try {
      // Try healing common LLM artifacts
      return JSON.parse(repairJson(rawText))
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON object found in response')
      try {
        return JSON.parse(repairJson(match[0]))
      } catch (e: any) {
        throw new Error(`JSON Repair failed: ${e.message}`)
      }
    }
  }
}

function getFallbackVerdict(reason: string): any {
  return {
    summary: `AI analysis unavailable (${reason}). Statistical metrics have been computed successfully.`,
    severity: 'LOW',
    affected_groups: [],
    root_cause: 'Manual review required.',
    board_summary: 'AI narrative unavailable. Review statistical metrics.',
    mitigations: [],
    _fallback: true,
    _reason: reason,
  }
}

// ─────────────────────────────────────────────
// ORCHESTRATOR — tries all providers in order
// ─────────────────────────────────────────────
export async function getVerdict(prompt: string): Promise<any> {
  // FIX 5: Automatic fallback chain — never crashes
  try {
    console.log('[Verdict] Trying Gemini...')
    return await askGemini(prompt)
  } catch (err: any) {
    console.warn('[Verdict] Gemini failed:', err.message)
  }

  try {
    console.log('[Verdict] Trying Groq...')
    return await askGroq(prompt)
  } catch (err: any) {
    console.warn('[Verdict] Groq failed:', err.message)
  }

  try {
    console.log('[Verdict] Trying HuggingFace...')
    return await askHuggingFace(prompt)
  } catch (err: any) {
    console.warn('[Verdict] HuggingFace failed:', err.message)
  }

  try {
    console.log('[Verdict] Trying OpenRouter...')
    return await askOpenRouter(prompt)
  } catch (err: any) {
    console.warn('[Verdict] OpenRouter failed:', err.message)
  }

  console.error('[Verdict] All providers failed. Returning fallback.')
  return getFallbackVerdict('All AI providers unavailable')
}

// ─────────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────────
export async function askGemini(prompt: string, useFallback = false): Promise<any> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GOOGLE_GEMINI_API_KEY')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: useFallback ? 'gemini-1.5-flash' : 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2048, // Increased to prevent un-terminated JSON responses
      },
    })

    // RESTORED: use just `prompt` (it is already prefixed with System instruction by route.ts)
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseVerdictResponse(text)
  } catch (err: any) {
    if (!useFallback && (err.message?.includes('503') || err.message?.includes('overloaded'))) {
      console.warn('[Gemini] Heavy load or API error, retrying with fallback mask...')
      return askGemini(prompt, true)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─────────────────────────────────────────────
// GROQ
// ─────────────────────────────────────────────
export async function askGroq(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Missing GROQ_API_KEY')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are a JSON-only AI. You output valid JSON objects and nothing else. No markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Groq ${res.status}: ${errBody.slice(0, 200)}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty Groq response')
    return parseVerdictResponse(content)
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─────────────────────────────────────────────
// HUGGING FACE  (2025 Serverless Inference API)
// Endpoint: api-inference.huggingface.co/v1/chat/completions
// Token requires: "Make calls to the Serverless Inference API" permission
// Fallback: Groq Secondary (Llama 4 Scout) if HF key is missing or returns 403
// ─────────────────────────────────────────────
export async function askHuggingFace(prompt: string): Promise<any> {
  const hfKey  = process.env.HUGGINGFACE_API_KEY
  const groqKey = process.env.GROQ_API_KEY

  // ── Try real HuggingFace serverless first ──────────────────────────────
  if (hfKey) {
    // 2025 global serverless endpoint — OpenAI-compatible
    const hfModels = [
      'Qwen/Qwen2.5-7B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3',
      'microsoft/Phi-3.5-mini-instruct',
    ]

    for (const model of hfModels) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000)

      try {
        const res = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'system',
                content: 'You are a JSON-only AI. Output ONLY a valid JSON object. No markdown, no explanation.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 1200,
          }),
        })

        clearTimeout(timeoutId)

        if (res.status === 403) {
          console.warn('[HF] Token lacks inference permissions — falling back to Groq Secondary')
          break // exit HF loop, drop into Groq fallback
        }

        if (res.status === 503) {
          console.warn(`[HF] ${model} loading (503). Trying next model...`)
          continue
        }

        if (!res.ok) {
          const errBody = await res.text()
          console.warn(`[HF] ${model} error ${res.status}: ${errBody.slice(0, 100)}`)
          continue
        }

        const data = await res.json()
        const content = data.choices?.[0]?.message?.content
        if (!content) {
          console.warn(`[HF] ${model} returned empty content`)
          continue
        }

        console.log(`[HF] ${model} succeeded`)
        return parseVerdictResponse(content)
      } catch (err: any) {
        clearTimeout(timeoutId)
        console.warn(`[HF] ${model} threw: ${err.message}`)
        continue
      }
    }
  } else {
    console.warn('[HF] No HUGGINGFACE_API_KEY — using Groq Secondary')
  }

  // ── Groq Secondary fallback (Qwen 3 → Llama 4 Scout) ─────────────────
  if (!groqKey) throw new Error('No HuggingFace key and no GROQ_API_KEY fallback available')

  const groqModels = [
    'qwen/qwen3-32b',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.1-8b-instant',
  ]

  for (const model of groqModels) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a JSON-only AI. Output ONLY valid JSON. No markdown, no explanation.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
        }),
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errBody = await res.text()
        console.warn(`[GroqSecondary] ${model} error ${res.status}: ${errBody.slice(0, 100)}`)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        console.warn(`[GroqSecondary] ${model} returned empty content`)
        continue
      }

      console.log(`[GroqSecondary] ${model} succeeded`)
      return parseVerdictResponse(content)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn(`[GroqSecondary] ${model} threw: ${err.message}`)
      continue
    }
  }

  throw new Error('HuggingFace and all Groq Secondary models failed.')
}

// ─────────────────────────────────────────────
// TOGETHER AI (HuggingFace Replacement)
// High-availability Free Tier
// ─────────────────────────────────────────────
export async function askTogether(prompt: string): Promise<any> {
  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) throw new Error("Missing TOGETHER_API_KEY")

  const models = [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct"
  ]

  for (const model of models) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Return ONLY valid JSON. No explanation."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        })
      })

      clearTimeout(timeoutId)
      if (!res.ok) {
        const errBody = await res.text()
        console.warn(`[Together] Model ${model} error ${res.status}: ${errBody.slice(0, 150)}`)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.warn(`[Together] Model ${model} returned empty content`)
        continue
      }

      return parseVerdictResponse(content)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn(`[Together] Model ${model} threw: ${err.message}`)
      continue
    }
  }

  throw new Error("All Together AI models unavailable")
}

// ─────────────────────────────────────────────
// OLLAMA (Local Inference)
// Zero billing, absolute resilience for Hackathons
// Requires: ollama run llama3:8b
// ─────────────────────────────────────────────
export async function askOllama(prompt: string): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // generous timeout for local compute

  try {
    console.log("[Ollama] pinging local model...")
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "mistral",
        messages: [
          {
            role: "system",
            content: "Return ONLY valid JSON. No markdown. No raw text. No explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          num_predict: 1500
        }
      })
    })

    clearTimeout(timeoutId)
    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Ollama HTTP ${res.status}: ${errBody}`)
    }

    const data = await res.json()
    const content = data.message?.content
    if (!content) throw new Error("Empty Ollama response")

    return parseVerdictResponse(content)
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw new Error(`Ollama unavailable (Ensure 'ollama serve' is running): ${err.message}`)
  }
}

// ─────────────────────────────────────────────
// OPENROUTER
// Free models with OpenAI-compatible API — great hackathon backup
// Get key at: https://openrouter.ai/keys
// ─────────────────────────────────────────────
export async function askOpenRouter(prompt: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY')

  // The live 2026 free models on OpenRouter
  const models = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'qwen/qwen3-coder:free',
    'minimax/minimax-m2.5:free'
  ]

  for (const model of models) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          // Recommended by OpenRouter for free-tier routing
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
          'X-Title': 'FairSight',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are a JSON-only AI. Output only a valid JSON object. No markdown, no explanation, no preamble.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 1200,
          response_format: { type: 'json_object' },
        }),
      })

      clearTimeout(timeoutId)

      // 429 = rate limited on this model, wait and try next
      if (res.status === 429) {
        console.warn(`[OpenRouter] Model ${model} rate-limited (429). Waiting 3s and trying next...`)
        await new Promise((r) => setTimeout(r, 3000))
        continue
      }

      if (!res.ok) {
        const errBody = await res.text()
        console.warn(`[OpenRouter] Model ${model} error ${res.status}: ${errBody.slice(0, 150)}`)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) {
        console.warn(`[OpenRouter] Model ${model} returned empty content`)
        continue
      }

      return parseVerdictResponse(content)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn(`[OpenRouter] Model ${model} threw: ${err.message}`)
      continue
    }
  }

  throw new Error('All OpenRouter models failed (rate-limited or format error).')
}
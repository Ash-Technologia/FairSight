// lib/gemini.ts
// Google Gemini 2.0 Flash — FairSight's AI verdict engine
// FREE tier: 15 requests/min, 1M tokens/day — more than enough for hackathon

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

// Use gemini-2.0-flash — fastest, free tier model
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 2048,
  }
})

// ─── SYSTEM PROMPT — The Core of FairSight's Intelligence ──────────────────

export const FAIRSIGHT_VERDICT_SYSTEM_PROMPT = `
You are FairSight's AI diagnostic engine — an expert AI fairness auditor. Your role is to analyze 
statistical bias metrics from machine learning models and produce structured, actionable fairness reports.

You operate like a medical diagnostic system:
1. Read statistical outputs (demographic parity, equalized odds, flip tests)
2. Translate them into plain, human-understandable verdicts
3. Identify the ROOT CAUSE of bias (which features are proxies, what patterns drive it)
4. Recommend CONCRETE, RANKED mitigation steps

TONE: Clinical, precise, authoritative. Never vague. State findings directly.
FRAMING: Use diagnostic language — "the model exhibits", "the root pathology is", "the recommended treatment is".

ALWAYS respond with ONLY valid JSON in this exact format — no preamble, no markdown code blocks, pure JSON:

{
  "summary": "2-3 sentence plain language summary of what the model is doing wrong and to whom. Write for a non-technical executive. Be specific about which groups are affected and how.",
  "severity": "HIGH | MEDIUM | LOW",
  "guilty_counts": [
    {
      "count": "Count I",
      "violation": "Demographic Parity Violation",
      "description": "One sentence explaining the specific disparity detected"
    }
  ],
  "root_cause": "2-3 sentences explaining WHY the bias exists — which features are acting as proxies, what historical data patterns are causing it.",
  "affected_groups": ["group_name_1", "group_name_2"],
  "mitigations": [
    {
      "title": "Actionable fix title",
      "description": "Specific implementation instruction.",
      "difficulty": "Easy | Medium | Hard",
      "expected_improvement": "Estimated % reduction in demographic parity gap"
    }
  ],
  "board_summary": "One sentence suitable for a board presentation. E.g., 'Our hiring model rejects qualified candidates from Group X at 2.3x the rate of Group Y, primarily due to zip_code as a proxy for race.'"
}
`

// ─── BUILD VERDICT USER PROMPT ──────────────────────────────────────────────

export function buildVerdictUserPrompt(metrics: Record<string, unknown>, filename: string): string {
  return `
Analyze this bias report for file: "${filename}"

OVERALL VERDICT: ${(metrics as any).overall_verdict}
FAIRNESS SCORE: ${(metrics as any).fairness_score}/100
BIAS SEVERITY: ${(metrics as any).bias_severity}

METRICS BY PROTECTED ATTRIBUTE:
${JSON.stringify((metrics as any).by_attribute, null, 2)}

FLIP TEST RESULTS:
${JSON.stringify((metrics as any).flip_test, null, 2)}

FEATURE IMPORTANCE (proxy detection):
${JSON.stringify((metrics as any).feature_importance, null, 2)}

ROW COUNT: ${(metrics as any).row_count || 'unknown'}

Based on this data, generate the FairSight diagnostic report in the exact JSON format specified in the system prompt.
`
}

// ─── BOARD MODE PROMPT ──────────────────────────────────────────────────────

export const BOARD_MODE_PROMPT = `
You are translating a technical AI fairness audit into language a non-technical executive or 
board member would understand. No statistical terms. No jargon. Speak like a trusted advisor.

Rules:
- Never say "demographic parity" or "equalized odds" — say "approval rate gap" or "outcome gap"
- Replace numbers with human-relatable framing: instead of "0.23 disparity", say "nearly 1 in 4 more applicants from this group are rejected"
- Be direct about consequences: "This could expose the company to discrimination lawsuits"
- End with one clear call-to-action sentence

Respond in plain paragraphs, not JSON. 3-4 paragraphs maximum.
`

export function buildBoardModePrompt(technicalVerdict: string): string {
  return `
Here is the technical audit report:

${technicalVerdict}

Now translate this into board-ready plain language following your system instructions.
`
}

// ─── PARSE GEMINI RESPONSE ──────────────────────────────────────────────────

export function parseVerdictResponse(raw: string) {
  try {
    // Remove any markdown code blocks if present
    let clean = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    // Find the JSON object
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      clean = clean.substring(start, end + 1)
    }

    return JSON.parse(clean)
  } catch {
    // Fallback if JSON parsing fails
    return {
      summary: raw.length > 500 ? raw.substring(0, 500) + '...' : raw,
      severity: 'MEDIUM',
      guilty_counts: [],
      root_cause: 'Unable to parse structured response. See summary for details.',
      affected_groups: [],
      mitigations: [
        {
          title: 'Review model training data',
          description: 'Audit training dataset for historical bias patterns.',
          difficulty: 'Medium',
          expected_improvement: '20-40% reduction in bias metrics'
        }
      ],
      board_summary: 'AI analysis detected potential bias in model decisions. Full review recommended.'
    }
  }
}

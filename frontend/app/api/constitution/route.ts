// frontend/app/api/constitution/route.ts
// Constitution rules — in-memory primary store (Vercel-safe) + file fallback for localhost

import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

// ── In-memory store (survives across requests in same serverless instance) ──
const _MEMORY: Record<string, any[]> = {}

const CACHE = (() => {
  try {
    // Use writable temp dir on both localhost and Vercel
    return path.join(
      process.env.VERCEL ? os.tmpdir() : process.cwd(),
      '.fairsight_constitution.json'
    )
  } catch { return '' }
})()

function load(uid: string): any[] {
  // Primary: in-memory
  if (_MEMORY[uid]) return _MEMORY[uid]
  // Secondary: disk (localhost)
  try {
    if (CACHE && fs.existsSync(CACHE)) {
      const all = JSON.parse(fs.readFileSync(CACHE, 'utf-8'))
      // Populate memory from disk on first read
      Object.assign(_MEMORY, all)
      return _MEMORY[uid] ?? []
    }
  } catch {}
  return []
}

function saveAll() {
  // Always update memory; best-effort write to disk
  try {
    if (CACHE) fs.writeFileSync(CACHE, JSON.stringify(_MEMORY, null, 2))
  } catch {}
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  return Response.json(load(uid))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, uid = 'guest', rule_text, rule, rule_id } = body

  // ── TRANSLATE plain English → structured JSON via Gemini ────────────────
  if (action === 'translate') {
    const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
    if (!GEMINI_KEY) return Response.json({ error: 'Gemini API key not configured' }, { status: 503 })

    const systemPrompt = `You are a legal-technical translator for AI fairness rules.
Convert the plain English fairness rule into structured JSON. Output ONLY valid JSON matching this schema exactly:
{
  "rule_id": "rule_${Date.now()}",
  "type": "demographic_parity_constraint" | "equalized_odds_constraint" | "approval_rate_constraint" | "representation_constraint",
  "attribute": "<protected attribute name, e.g. gender, race, age>",
  "groups": ["<group1>", "<group2>"],
  "max_disparity": <number between 0 and 1>,
  "applies_to": "approval_rate" | "tpr" | "fpr",
  "plain_english": "<the original rule text>",
  "severity_if_violated": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "gdpr_article": "Art. 22 GDPR" | "EEOC 4/5ths Rule" | "EU AI Act Art. 10" | null
}
Return ONLY JSON. No explanation. No markdown. No code fences.`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nRule: ${rule_text}` }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' },
          }),
        }
      )
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in Gemini response')
      const parsed = JSON.parse(jsonMatch[0])
      parsed.rule_id = `rule_${Date.now()}`
      parsed.plain_english = rule_text
      parsed.active = true
      return Response.json(parsed)
    } catch (e: any) {
      return Response.json({ error: `Translation failed: ${e.message}` }, { status: 500 })
    }
  }

  // ── SAVE ─────────────────────────────────────────────────────────────────
  if (action === 'save') {
    if (!rule) return Response.json({ error: 'rule required' }, { status: 400 })
    _MEMORY[uid] = _MEMORY[uid] ?? []
    const idx = _MEMORY[uid].findIndex((r: any) => r.rule_id === rule.rule_id)
    const entry = { ...rule, active: true, created_at: rule.created_at ?? new Date().toISOString() }
    if (idx >= 0) _MEMORY[uid][idx] = entry
    else _MEMORY[uid].push(entry)
    saveAll()
    return Response.json({ status: 'saved', rule: entry })
  }

  // ── TOGGLE ────────────────────────────────────────────────────────────────
  if (action === 'toggle') {
    _MEMORY[uid] = _MEMORY[uid] ?? []
    const r = _MEMORY[uid].find((r: any) => r.rule_id === rule_id)
    if (r) r.active = !r.active
    saveAll()
    return Response.json({ status: 'toggled', active: r?.active })
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    _MEMORY[uid] = (_MEMORY[uid] ?? []).filter((r: any) => r.rule_id !== rule_id)
    saveAll()
    return Response.json({ status: 'deleted' })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

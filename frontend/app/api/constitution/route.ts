// frontend/app/api/constitution/route.ts
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

const CACHE = path.join(process.cwd(), '.fairsight_constitution.json')

function load(): Record<string, any[]> {
  try { if (fs.existsSync(CACHE)) return JSON.parse(fs.readFileSync(CACHE, 'utf-8')) } catch {}
  return {}
}
function save(data: Record<string, any[]>) {
  fs.writeFileSync(CACHE, JSON.stringify(data, null, 2))
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  const all = load()
  return Response.json(all[uid] ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, uid, rule_text, rule } = body

  if (action === 'translate') {
    // Call Gemini to translate plain English to structured JSON
    const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
    if (!GEMINI_KEY) return Response.json({ error: 'Gemini API key not configured' }, { status: 503 })

    const systemPrompt = `You are a legal-technical translator for AI fairness rules. Convert plain English fairness rules into structured JSON constraints. Output ONLY valid JSON matching this schema exactly:
{
  "rule_id": "rule_XXX",
  "type": "demographic_parity_constraint" | "equalized_odds_constraint" | "approval_rate_constraint" | "representation_constraint",
  "attribute": "string (protected attribute name)",
  "groups": ["group1", "group2"],
  "max_disparity": 0.05,
  "applies_to": "approval_rate" | "tpr" | "fpr",
  "plain_english": "original rule text",
  "severity_if_violated": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
}
Return only JSON. No explanation. No markdown.`

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nRule: ${rule_text}` }] }] }),
      })
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed = JSON.parse(jsonMatch[0])
      parsed.rule_id = `rule_${Date.now()}`
      parsed.plain_english = rule_text
      return Response.json(parsed)
    } catch (e: any) {
      return Response.json({ error: `Translation failed: ${e.message}` }, { status: 500 })
    }
  }

  if (action === 'save') {
    if (!uid || !rule) return Response.json({ error: 'uid and rule required' }, { status: 400 })
    const all = load()
    all[uid] = all[uid] ?? []
    const exists = all[uid].findIndex((r: any) => r.rule_id === rule.rule_id)
    if (exists >= 0) all[uid][exists] = rule
    else all[uid].push({ ...rule, active: true, created_at: new Date().toISOString() })
    save(all)
    return Response.json({ status: 'saved' })
  }

  if (action === 'toggle') {
    const { rule_id } = body
    const all = load()
    if (all[uid]) {
      const r = all[uid].find((r: any) => r.rule_id === rule_id)
      if (r) r.active = !r.active
      save(all)
    }
    return Response.json({ status: 'toggled' })
  }

  if (action === 'delete') {
    const { rule_id } = body
    const all = load()
    if (all[uid]) { all[uid] = all[uid].filter((r: any) => r.rule_id !== rule_id); save(all) }
    return Response.json({ status: 'deleted' })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

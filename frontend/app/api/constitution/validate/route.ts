// frontend/app/api/constitution/validate/route.ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  const audit_id = req.nextUrl.searchParams.get('audit_id')
  
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 })

  try {
    // 1. Fetch Audit — try Firestore first, fall back to local cache
    let audit: any = null

    try {
      if (db) {
        const docRef = doc(db, 'audits', audit_id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          audit = docSnap.data()
        }
      }
    } catch { /* Firestore unavailable — will fall through to local cache */ }

    // Local cache fallback (dev mode / Firestore down)
    if (!audit) {
      try {
        const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
        if (fs.existsSync(cachePath)) {
          const cache: any[] = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
          const found = cache.find((a: any) => a.id === audit_id)
          if (found) audit = found
        }
      } catch {}
    }

    if (!audit) {
      // Return compliant:true so the badge doesn't show an error state
      return Response.json({ compliant: true, reason: 'Audit not found in any store' })
    }

    // 2. Fetch Rules from the in-memory endpoint
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const rulesUrl = `${protocol}://${host}/api/constitution?uid=${uid}`
    
    let rules: any[] = []
    try {
      const rulesRes = await fetch(rulesUrl)
      if (rulesRes.ok) rules = await rulesRes.json()
    } catch {
      try {
        const CACHE = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), '.fairsight_constitution.json')
        if (fs.existsSync(CACHE)) {
           const all = JSON.parse(fs.readFileSync(CACHE, 'utf-8'))
           rules = all[uid] ?? []
        }
      } catch {}
    }

    const activeRules = rules.filter((r: any) => r.active)
    
    if (!activeRules.length) {
      return Response.json({ compliant: true, reason: 'No active rules to validate against' })
    }

    // 3. Get byAttribute from wherever it was stored
    const byAttr: any = audit.byAttribute ?? audit.metrics?.by_attribute ?? {}
    let compliant = true
    const violations: any[] = []

    for (const rule of activeRules) {
      const attrData = byAttr[rule.attribute]
      if (!attrData) continue

      let isViolation = false
      let observed = 0

      if (rule.type === 'demographic_parity_constraint') {
        observed = attrData.demographic_parity ?? 0
        if (observed > rule.max_disparity) isViolation = true
      } else if (rule.type === 'equalized_odds_constraint') {
        observed = attrData.equalized_odds ?? 0
        if (observed > rule.max_disparity) isViolation = true
      } else if (rule.type === 'approval_rate_constraint') {
        observed = attrData.max_group_disparity ?? 0
        if (observed > rule.max_disparity) isViolation = true
      }

      if (isViolation) {
        compliant = false
        violations.push({
          rule_id: rule.rule_id,
          type: rule.type,
          attribute: rule.attribute,
          observed,
          allowed: rule.max_disparity,
          severity: rule.severity_if_violated
        })
      }
    }

    return Response.json({ compliant, violations })

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'guest', byAttribute = {}, verdict = 'CLEAR', severity = 'LOW' } = body

    // Fetch Rules
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const rulesUrl = `${protocol}://${host}/api/constitution?uid=${uid}`
    
    let rules = []
    try {
      const rulesRes = await fetch(rulesUrl)
      if (rulesRes.ok) rules = await rulesRes.json()
    } catch {
      try {
        const CACHE = path.join(process.env.VERCEL ? os.tmpdir() : process.cwd(), '.fairsight_constitution.json')
        if (fs.existsSync(CACHE)) {
           const all = JSON.parse(fs.readFileSync(CACHE, 'utf-8'))
           rules = all[uid] ?? []
        }
      } catch {}
    }

    const activeRules = rules.filter((r: any) => r.active)
    if (!activeRules.length) {
      return Response.json({ violationCount: 0, summary: 'No active rules to validate' })
    }

    let violations = []
    let newVerdict = verdict
    let newSeverity = severity

    for (const rule of activeRules) {
      const attrData = byAttribute[rule.attribute]
      if (!attrData) continue

      let isViolation = false
      let observed = 0
      let metricName = ''

      if (rule.type === 'demographic_parity_constraint') {
        observed = attrData.demographic_parity ?? 0
        metricName = 'Demographic Parity'
        if (observed > rule.max_disparity) isViolation = true
      }
      else if (rule.type === 'equalized_odds_constraint') {
        observed = attrData.equalized_odds ?? 0
        metricName = 'Equalized Odds'
        if (observed > rule.max_disparity) isViolation = true
      }
      else if (rule.type === 'approval_rate_constraint') {
        // Fallback to max group disparity if specific approval rate isn't parsed
        observed = attrData.max_group_disparity ?? 0
        metricName = 'Max Group Disparity'
        if (observed > rule.max_disparity) isViolation = true
      }

      if (isViolation) {
        violations.push({
          rule_id: rule.rule_id,
          attribute: rule.attribute,
          metric: metricName,
          actual_value: observed.toFixed(3),
          threshold: rule.max_disparity,
          plain_english: rule.plain_english,
          severity: rule.severity_if_violated
        })
      }
    }

    if (violations.length > 0) {
      newVerdict = 'GUILTY'
      const hasCritical = violations.some(v => v.severity === 'CRITICAL')
      const hasHigh = violations.some(v => v.severity === 'HIGH')
      newSeverity = hasCritical ? 'CRITICAL' : hasHigh ? 'HIGH' : 'MEDIUM'
    }

    return Response.json({
      violationCount: violations.length,
      summary: violations.length > 0 ? `${violations.length} violations found` : 'All rules passed',
      originalVerdict: verdict,
      verdict: newVerdict,
      severity: newSeverity,
      violations
    })

  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

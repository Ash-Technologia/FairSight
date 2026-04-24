// frontend/app/api/constitution/validate/route.ts
import { NextRequest } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import fs from 'fs'
import path from 'path'
import os from 'os'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  const audit_id = req.nextUrl.searchParams.get('audit_id')
  
  if (!audit_id) return Response.json({ error: 'audit_id required' }, { status: 400 })

  try {
    // 1. Fetch Audit
    const doc = await adminDb.collection('audits').doc(audit_id).get()
    if (!doc.exists) return Response.json({ error: 'Audit not found' }, { status: 404 })
    const audit = doc.data()!

    // 2. Fetch Rules from the in-memory endpoint (we must fetch from the local route via HTTP since memory is isolated per file)
    const host = req.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const rulesUrl = `${protocol}://${host}/api/constitution?uid=${uid}`
    
    let rules = []
    try {
      const rulesRes = await fetch(rulesUrl)
      if (rulesRes.ok) rules = await rulesRes.json()
    } catch {
      // Fallback: try reading the file directly if fetch fails (e.g. during build)
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

    const metrics = audit.metrics || {}
    const byAttr = metrics.by_attribute || {}
    let compliant = true
    let violations = []

    for (const rule of activeRules) {
      const attrData = byAttr[rule.attribute]
      if (!attrData) continue // Attribute not present in this audit

      let isViolation = false
      let observed = 0

      if (rule.type === 'demographic_parity_constraint') {
        observed = attrData.demographic_parity ?? 0
        if (observed > rule.max_disparity) isViolation = true
      }
      else if (rule.type === 'equalized_odds_constraint') {
        observed = attrData.equalized_odds ?? 0
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

// frontend/app/api/constitution/validate/route.ts
//
// POST /api/constitution/validate
// Body: { uid: string, auditId?: string, byAttribute: Record<string, any>, fairnessScore: number, verdict: string }
//
// Runs the user's active FairSight Constitution rules against an audit result.
// If a rule is violated:
//   - CLEAR  → downgraded to BORDERLINE (constitution rule violated)
//   - GUILTY → severity may be escalated
// Returns the violation list and an updated verdict + severity.
//
// This makes the Constitution page directly affect audit outcomes — it's
// otherwise decorative.

import fs from 'fs'
import path from 'path'

const CONST_PATH = path.join(process.cwd(), '.fairsight_constitution.json')

function loadRules(uid: string): any[] {
  try {
    if (!fs.existsSync(CONST_PATH)) return []
    const db = JSON.parse(fs.readFileSync(CONST_PATH, 'utf8'))
    return db[uid] || db['guest'] || []
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      uid = 'guest',
      byAttribute = {},
      fairnessScore = 100,
      verdict = 'CLEAR',
      severity = 'LOW',
    } = body

    const rules: any[] = loadRules(uid).filter((r: any) => r.active)

    if (rules.length === 0) {
      return Response.json({
        violations: [],
        verdict,
        severity,
        fairnessScore,
        constitutionApplied: false,
        message: 'No active constitution rules found.',
      })
    }

    const violations: any[] = []

    for (const rule of rules) {
      const attrData = byAttribute[rule.attribute]
      if (!attrData) continue

      const maxDisp = rule.max_disparity ?? 0.10
      let violated = false
      let actualValue = 0
      let metricUsed = rule.type

      if (rule.type === 'demographic_parity_constraint') {
        actualValue = attrData.demographic_parity ?? 0
        violated = actualValue > maxDisp
      } else if (rule.type === 'equalized_odds_constraint') {
        actualValue = attrData.equalized_odds ?? 0
        violated = actualValue > maxDisp
      } else if (rule.type === 'disparate_impact_constraint') {
        actualValue = attrData.disparate_impact_ratio ?? 1.0
        violated = actualValue < (rule.min_ratio ?? 0.8)
      } else {
        // Generic: check max_group_disparity
        actualValue = attrData.max_group_disparity ?? 0
        violated = actualValue > maxDisp
        metricUsed = 'max_group_disparity'
      }

      if (violated) {
        violations.push({
          rule_id:         rule.id ?? `rule-${violations.length}`,
          plain_english:   rule.plain_english,
          attribute:       rule.attribute,
          metric:          metricUsed,
          actual_value:    round4(actualValue),
          threshold:       maxDisp,
          severity_if_violated: rule.severity_if_violated ?? 'HIGH',
        })
      }
    }

    // ── Downgrade / escalate verdict ───────────────────────────────────────
    let updatedVerdict  = verdict
    let updatedSeverity = severity

    if (violations.length > 0) {
      const maxSev = violations.some(v => v.severity_if_violated === 'CRITICAL') ? 'CRITICAL'
        : violations.some(v => v.severity_if_violated === 'HIGH') ? 'HIGH'
        : 'MEDIUM'

      // CLEAR → BORDERLINE when constitution rules are violated
      if (verdict === 'CLEAR') {
        updatedVerdict  = 'BORDERLINE'
        updatedSeverity = maxSev === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
      }

      // BORDERLINE → GUILTY when CRITICAL constitution violation
      if (verdict === 'BORDERLINE' && maxSev === 'CRITICAL') {
        updatedVerdict  = 'GUILTY'
        updatedSeverity = 'CRITICAL'
      }

      // GUILTY: escalate severity if constitution says CRITICAL
      if (verdict === 'GUILTY' && maxSev === 'CRITICAL' && updatedSeverity !== 'CRITICAL') {
        updatedSeverity = 'CRITICAL'
      }
    }

    const summary = violations.length === 0
      ? 'All active constitution rules passed.'
      : `${violations.length} constitution rule${violations.length > 1 ? 's' : ''} violated. Verdict downgraded from ${verdict} → ${updatedVerdict}.`

    return Response.json({
      violations,
      verdict:            updatedVerdict,
      severity:           updatedSeverity,
      fairnessScore,
      originalVerdict:    verdict,
      constitutionApplied: true,
      rulesChecked:       rules.length,
      violationCount:     violations.length,
      summary,
    })
  } catch (err: any) {
    console.error('[constitution/validate]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000
}

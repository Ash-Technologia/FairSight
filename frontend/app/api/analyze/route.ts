// frontend/app/api/analyze/route.ts  — v3.0
//
// CRITICAL FIXES applied (vs v2.0):
//  [BUG-1] proxyFeatures: body.feature_importance?.proxy_features (was metrics.feature_importance)
//  [BUG-2] flipTest: body.flip_test (was metrics.flip_test — always {})
//  [BUG-3] datasetHash: body.dataset_hash (was metrics.dataset_hash — always '')
//  [BUG-4] rowCount: body.row_count (was metrics.row_count — always 0)
//  [BUG-5] protectedColumns: body.protected_attributes (was metrics.protected_columns_analyzed)
//  [BUG-6] byAttribute: stores full metrics.by_attribute (not just first attribute flattened)
//  [BUG-7] Duplicate broadcast removed — backend already broadcasts via /analyze router
//  [BUG-8] simulatedAvg replaced with real /monitor/stats call (see monitor/page.tsx fix)
//  [BUG-9] consensusLevel: majority-vote logic replaces fallback-priority chain
//
// No backend changes required — all fixes are frontend data-routing corrections.

import {
  buildVerdictUserPrompt,
  askGemini,
  askGroq,
  askOllama,
  askHuggingFace,
  askMistral,
  FAIRSIGHT_VERDICT_SYSTEM_PROMPT,
} from '@/lib/ai'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

export const maxDuration = 60

export async function POST(req: Request) {
  let metrics: any = null
  let filename = 'unknown'
  let uid = 'guest'

  try {
    // ── Parse full backend response body ──────────────────────────────────
    // IMPORTANT: The FastAPI /analyze_dataset response structure is:
    //   body.metrics         → bias metrics (demographic_parity, etc.)
    //   body.feature_importance → proxy features, top features, root cause
    //   body.flip_test       → flip test results
    //   body.dataset_hash    → sha256 hash string
    //   body.row_count       → integer
    //   body.protected_attributes → string[]
    //   body.by_attribute    → per-protected-attribute breakdown
    //
    // v1/v2 bugs: many fields were read from `metrics` instead of `body`
    // because they live at the TOP LEVEL of the response, not nested under metrics.

    const body = await req.json()
    metrics = body.metrics ?? null
    filename = body.filename ?? 'unknown'
    uid = body.uid ?? 'guest'

    if (!metrics) {
      return Response.json({ error: 'No metrics provided' }, { status: 400 })
    }

    if (!metrics.by_attribute) {
      metrics.by_attribute = {}
    }

    const userPrompt = buildVerdictUserPrompt(metrics, filename)
    const fullPrompt = `${FAIRSIGHT_VERDICT_SYSTEM_PROMPT}\n\n${userPrompt}`

    console.log(`[analyze] Running AI consensus for "${filename}" (uid: ${uid})`)
    const t0 = Date.now()

    const [rGemini, rGroq, rOllama, rHF, rMistral] = await Promise.all([
      askGemini(fullPrompt)
        .then((v) => ({ v, t: Date.now() - t0, ok: true }))
        .catch((e) => {
          console.error('[Gemini] failed:', e.message)
          return { v: null, t: Date.now() - t0, ok: false, error: e.message }
        }),
      askGroq(fullPrompt)
        .then((v) => ({ v, t: Date.now() - t0, ok: true }))
        .catch((e) => {
          console.error('[Groq] failed:', e.message)
          return { v: null, t: Date.now() - t0, ok: false, error: e.message }
        }),
      askOllama(fullPrompt)
        .then((v) => ({ v, t: Date.now() - t0, ok: true }))
        .catch((e) => {
          console.error('[Ollama] failed:', e.message)
          return { v: null, t: Date.now() - t0, ok: false, error: e.message }
        }),
      askHuggingFace(fullPrompt)
        .then((v) => ({ v, t: Date.now() - t0, ok: true }))
        .catch((e) => {
          console.error('[HuggingFace] failed:', e.message)
          return { v: null, t: Date.now() - t0, ok: false, error: e.message }
        }),
      askMistral(fullPrompt)
        .then((v) => ({ v, t: Date.now() - t0, ok: true }))
        .catch((e) => {
          console.error('[Mistral] failed:', e.message)
          return { v: null, t: Date.now() - t0, ok: false, error: e.message }
        }),
    ])

    const verdicts = {
      gemini:     rGemini.v,
      groq:       rGroq.v,
      ollama:     rOllama.v,
      huggingface: rHF.v,
      mistral:    rMistral.v,
    }

    const latencies = {
      gemini:     rGemini.t,
      groq:       rGroq.t,
      ollama:     rOllama.t,
      huggingface: rHF.t,
      mistral:    rMistral.t,
    }

    const errors = {
      gemini:     (rGemini  as any).error ?? null,
      groq:       (rGroq    as any).error ?? null,
      ollama:     (rOllama  as any).error ?? null,
      huggingface: (rHF     as any).error ?? null,
      mistral:    (rMistral as any).error ?? null,
    }

    // ── HEALTH LOGGING ──
    if (rGemini.ok)  console.log(`[AI] Gemini success in ${rGemini.t}ms`)
    if (rGroq.ok)    console.log(`[AI] Groq success in ${rGroq.t}ms`)
    if (rOllama.ok)  console.log(`[AI] Ollama success in ${rOllama.t}ms (local)`)
    if (rHF.ok)      console.log(`[AI] HuggingFace success in ${rHF.t}ms`)
    if (rMistral.ok) console.log(`[AI] Mistral success in ${rMistral.t}ms`)

    // ── [BUG-9 FIX] 5-model majority-vote consensus ───────────────────────
    // With 5 models: 3+ agree = strong; 2 agree with 3+ active = partial;
    // all different = split. When 4 agree and 1 dissents, the dissent is
    // shown as a red flag in ModelConsensusPanel — the key demo moment.
    const activeSeverities = [
      verdicts.gemini?.severity,
      verdicts.groq?.severity,
      verdicts.ollama?.severity,
      verdicts.huggingface?.severity,
      verdicts.mistral?.severity,
    ].filter(Boolean) as string[]

    let consensusLevel = 'none'
    let majorityVerdict: any = null

    if (activeSeverities.length > 0) {
      const counts: Record<string, number> = {}
      activeSeverities.forEach((s) => (counts[s] = (counts[s] || 0) + 1))
      const maxCount = Math.max(...Object.values(counts))
      const majorityKey = Object.keys(counts).find((k) => counts[k] === maxCount)!

      if (activeSeverities.length === 1) consensusLevel = 'single'
      else if (maxCount === activeSeverities.length) consensusLevel = 'strong'
      else if (maxCount > 1) consensusLevel = 'partial'
      else consensusLevel = 'split'

      // Pick verdict from majority-severity model (prefer groq for summary quality)
      const majorityModels = [verdicts.groq, verdicts.gemini, verdicts.mistral, verdicts.ollama, verdicts.huggingface]
        .filter((v) => v?.severity === majorityKey)
      majorityVerdict = majorityModels[0] ?? null

      // Detect dissenting model(s) — shown as red flags in ModelConsensusPanel
      const dissenters = Object.entries(verdicts)
        .filter(([_k, v]) => v && v.severity !== majorityKey)
        .map(([k]) => k)
      if (dissenters.length > 0) {
        console.log(`[AI] Dissenting models: ${dissenters.join(', ')} — majority: ${majorityKey}`)
      }
    }

    const primaryVerdict =
      majorityVerdict ??
      verdicts.groq ??
      verdicts.gemini ??
      verdicts.huggingface ??
      verdicts.ollama ?? {
        summary: `Analysis of "${filename}" completed. Statistical fairness score: ${metrics?.fairness_score ?? 0}/100.`,
        severity: metrics?.bias_severity ?? 'LOW',
        root_cause: body.feature_importance?.root_cause ?? 'No AI analysis available — all providers failed.',
        affected_groups: [],
        mitigations: [],
        board_summary: `Fairness score: ${metrics?.fairness_score ?? 0}/100.`,
        _fallback: true,
      }

    const activeCauses = [
      verdicts.gemini?.root_cause,
      verdicts.groq?.root_cause,
      verdicts.ollama?.root_cause,
      verdicts.huggingface?.root_cause,
    ].filter(Boolean) as string[]
    const synthesizedRootCause =
      activeCauses.sort((a, b) => b.length - a.length)[0] ?? primaryVerdict.root_cause

    // ── Flatten first attribute metrics for BiasMetricBars component ─────
    // (kept for backward compat with BiasMetricBars which expects flat metrics)
    const firstAttribute = Object.values(metrics.by_attribute ?? {})[0] as any
    const flatMetrics = {
      demographic_parity: firstAttribute?.demographic_parity ?? 0,
      equalized_odds: firstAttribute?.equalized_odds ?? 0,
      calibration_gap: firstAttribute?.calibration_gap ?? 0,
      individual_fairness:
        firstAttribute?.individual_fairness ?? firstAttribute?.max_group_disparity ?? 0,
    }

    // ── [FEATURE] Compute Confidence Score & Auto-Adjust Severity ──
    let confidenceLevel = 1.0
    try {
      const cachePathFB = path.join(process.cwd(), '.fairsight_feedback.json')
      if (fs.existsSync(cachePathFB)) {
        const cacheFB = JSON.parse(fs.readFileSync(cachePathFB, 'utf-8'))
        if (cacheFB.length > 0) {
          const positives = cacheFB.filter((f: any) => f.rating === 'positive').length
          confidenceLevel = positives / cacheFB.length
        }
      }
      
      if (confidenceLevel < 0.6 && primaryVerdict.severity) {
        if (primaryVerdict.severity === 'HIGH') primaryVerdict.severity = 'MEDIUM'
        else if (primaryVerdict.severity === 'MEDIUM') primaryVerdict.severity = 'LOW'
      }
    } catch (e) {
      console.error("Confidence score computation error", e)
    }

    // ── [BUG-1 FIX] Proxy features from body.feature_importance, not metrics ──
    // Old: metrics.feature_importance?.proxy_features  → always undefined → []
    // New: body.feature_importance?.proxy_features     → real dataset columns
    const proxyFeatures: string[] = body.feature_importance?.proxy_features ?? []

    // ── [BUG-2 FIX] flip_test lives at body level, not inside metrics ────
    const flipTest = body.flip_test ?? {}

    // ── [BUG-3 FIX] dataset_hash lives at body level ──────────────────────
    const datasetHash = body.dataset_hash ?? ''

    // ── [BUG-4 FIX] row_count lives at body level ─────────────────────────
    const rowCount = body.row_count ?? 0

    // ── [BUG-5 FIX] protected_attributes lives at body level ─────────────
    const protectedColumns = body.protected_attributes ?? []

    // ── [BUG-6 FIX] Store FULL by_attribute breakdown, not just first ─────
    // Old: metrics: flatMetrics (lost race/gender split)
    // New: byAttribute stores full map; flatMetrics kept for UI compat
    const byAttribute = metrics.by_attribute ?? {}

    // ── [FEATURE] Enforce Fairness Constitution Rules ──
    let constitutionViolations: any[] = []
    try {
      const host = req.headers.get('host') || 'localhost:3000'
      const protocol = host.includes('localhost') ? 'http' : 'https'
      const rulesUrl = `${protocol}://${host}/api/constitution?uid=${uid}`

      let userRules = []
      try {
        const rulesRes = await fetch(rulesUrl)
        if (rulesRes.ok) userRules = await rulesRes.json()
      } catch {
        // Fallback to disk if fetch fails (e.g., during build or dev cold start)
        const constPath = path.join(process.cwd(), '.fairsight_constitution.json')
        if (fs.existsSync(constPath)) {
          const rulesDB = JSON.parse(fs.readFileSync(constPath, 'utf8'))
          userRules = rulesDB[uid] || rulesDB['guest'] || []
        }
      }

      userRules.filter((r: any) => r.active).forEach((rule: any) => {
        const attrData = byAttribute[rule.attribute]
        if (attrData) {
          let violation = false
          const maxDisp = rule.max_disparity || 0.10
          if (rule.type === 'demographic_parity_constraint' && attrData.demographic_parity > maxDisp) {
            violation = true
          } else if (rule.type === 'equalized_odds_constraint' && attrData.equalized_odds > maxDisp) {
            violation = true
          } else if (attrData.max_group_disparity > maxDisp) {
            violation = true
          }
          if (violation) {
            constitutionViolations.push(rule)
          }
        }
      })
    } catch(e) {
      console.error('Failed to enforce constitution:', e)
    }

    if (constitutionViolations.length > 0) {
      metrics.overall_verdict = 'GUILTY'
      const highestSeverity = constitutionViolations.some(r => r.severity_if_violated === 'CRITICAL') ? 'CRITICAL' : 
                              constitutionViolations.some(r => r.severity_if_violated === 'HIGH') ? 'HIGH' : 'MEDIUM'
      if (highestSeverity === 'CRITICAL' || (highestSeverity === 'HIGH' && primaryVerdict.severity !== 'CRITICAL')) {
        primaryVerdict.severity = highestSeverity
      }
      const violText = constitutionViolations.map(r => `Constitution Rule Violated: ${r.plain_english}`).join(' | ')
      primaryVerdict.root_cause = `[CONSTITUTION VIOLATION] ${violText}. ` + primaryVerdict.root_cause
      primaryVerdict.mitigations = [
        {
          title: "Address Constitution Violation",
          description: violText,
          expected_improvement: "Compliance with internal governance."
        },
        ...(primaryVerdict.mitigations || [])
      ]
    }

    let auditId = `audit-${Date.now()}`

    const docData: any = {
      uid,
      filename,
      verdict: metrics.overall_verdict ?? 'CLEAR',
      fairnessScore: metrics.fairness_score ?? 0,
      aiVerdict: primaryVerdict.summary,
      rootCause: primaryVerdict.root_cause,
      synthesizedRootCause,
      boardSummary: primaryVerdict.board_summary,
      severity: primaryVerdict.severity,
      consensusLevel,
      confidenceLevel,
      affectedGroups: primaryVerdict.affected_groups ?? [],

      // ↓ All FIXED fields ↓
      proxyFeatures,         // [BUG-1] real dataset proxy columns
      flipTest,              // [BUG-2] actual flip test results
      datasetHash,           // [BUG-3] actual sha256 hash
      rowCount,              // [BUG-4] actual row count
      protectedColumns,      // [BUG-5] actual protected attribute list
      byAttribute,           // [BUG-6] full per-attribute breakdown

      // Kept for BiasMetricBars component backward compat
      metrics: flatMetrics,

      mitigations: primaryVerdict.mitigations ?? [],
      guiltyCounts: primaryVerdict.guilty_counts ?? [],
      createdAt: Date.now(),
      aiVerdicts: verdicts,
      aiLatencies: latencies,
      aiErrors: errors,

      // Extra fields for PDF + report page improvements
      piiWarnings: body.pii_warnings ?? null,
      featureImportance: body.feature_importance ?? null,
      intersectional: body.intersectional ?? null,
    }

    try {
      if (!db) throw new Error('Firestore not initialized')
      const docRef = await addDoc(collection(db, 'audits'), {
        ...docData,
        createdAt: serverTimestamp(),
      })
      auditId = docRef.id
      console.log(`[analyze] Saved to Firestore: ${auditId}`)
    } catch (dbErr: any) {
      console.warn('[analyze] Firestore save failed, using local cache:', dbErr.message)
      const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
      let cache: any[] = []
      try {
        if (fs.existsSync(cachePath)) {
          cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
        }
      } catch { }
      cache.unshift({ id: auditId, ...docData })
      if (cache.length > 100) cache = cache.slice(0, 100)
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
    }

    // ── [BUG-7 FIX] Removed duplicate /events/broadcast fetch ─────────────
    // Backend router (backend/routers/analyze.py) already calls push_event()
    // after every analysis. Calling it again from Next.js caused:
    //   • Double-count in Live Monitor event stream
    //   • Race condition between backend broadcast and frontend broadcast
    // The backend broadcast now carries fairnessScore + severity natively.
    // If you need frontend→backend ping for a DIFFERENT reason (e.g. multi-tab
    // sync), add it back with a distinct event type like 'FRONTEND_PING'.

    return Response.json({
      auditId,
      verdict: primaryVerdict,
      verdicts,
      latencies,
      errors,
      metrics: flatMetrics,
      byAttribute,
      consensusLevel,
      confidenceLevel,
      proxyFeatures,
      flipTest,
      datasetHash,
      rowCount,
      protectedColumns,
    })
  } catch (error: any) {
    console.error('[analyze] Fatal error:', error)
    return Response.json({ error: 'System error: ' + error.message }, { status: 500 })
  }
}
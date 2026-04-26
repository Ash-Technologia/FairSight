'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/Toast'
import { Scale, Sparkles, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Edit2, CheckCircle } from 'lucide-react'

const SEVERITY_COLOR: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed',
}
const TYPE_LABEL: Record<string, string> = {
  demographic_parity_constraint: 'Demographic Parity',
  equalized_odds_constraint: 'Equalized Odds',
  approval_rate_constraint: 'Approval Rate',
  representation_constraint: 'Representation',
}

interface ConstitutionRule {
  rule_id: string
  type: string
  attribute: string
  groups: string[]
  max_disparity: number
  applies_to: string
  plain_english: string
  severity_if_violated: string
  active: boolean
  created_at?: string
}

export default function ConstitutionPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const uid = user?.uid ?? 'guest'

  const [rules, setRules] = useState<ConstitutionRule[]>([])
  const [ruleText, setRuleText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translated, setTranslated] = useState<ConstitutionRule | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [verifyingRuleId, setVerifyingRuleId] = useState<string | null>(null)

  const load = () => {
    fetch(`/api/constitution?uid=${uid}`).then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRules(data)
    }).catch(() => {})
  }

  useEffect(() => { load() }, [uid])

  const handleTranslate = async () => {
    if (!ruleText.trim()) return
    setTranslating(true); setTranslated(null)
    try {
      const res = await fetch('/api/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'translate', uid, rule_text: ruleText }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setTranslated(data)
    } catch (e: any) {
      showToast(e.message || 'Translation failed', 'error')
    } finally {
      setTranslating(false)
    }
  }

  const handleSave = async () => {
    if (!translated) return
    setSaving(true)
    try {
      const payload = { ...translated }
      if (editingRuleId) payload.rule_id = editingRuleId

      await fetch('/api/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', uid, rule: payload }),
      })
      showToast(editingRuleId ? 'Rule updated successfully!' : 'Rule added to your Constitution!', 'success')
      setRuleText(''); setTranslated(null); setEditingRuleId(null)
      load()
    } catch { showToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const handleEdit = (rule: ConstitutionRule) => {
    setEditingRuleId(rule.rule_id)
    setRuleText(rule.plain_english)
    setTranslated(rule)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleVerifySingle = async (rule: ConstitutionRule) => {
    setVerifyingRuleId(rule.rule_id)
    try {
      const verdictRes = await fetch(`/api/verdict?uid=${uid}`)
      const verdicts = await verdictRes.json()
      if (!Array.isArray(verdicts) || verdicts.length === 0) {
        showToast('No audit found to verify against.', 'error')
        return
      }
      const latest = verdicts.sort((a: any, b: any) => b.createdAt - a.createdAt)[0]
      const res = await fetch('/api/constitution/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          byAttribute: latest.byAttribute ?? {},
          fairnessScore: latest.fairnessScore ?? 100,
          verdict: latest.verdict ?? 'CLEAR',
          severity: latest.severity ?? 'LOW',
        }),
      })
      const data = await res.json()
      // Match by rule_id or plain_english
      const isViolated = data.violations?.some((v: any) => v.plain_english === rule.plain_english)
      if (isViolated) {
        showToast(`Rule Failed: Latest audit violates this rule.`, 'error')
      } else {
        showToast(`Rule Passed: Latest audit complies.`, 'success')
      }
    } catch (e: any) {
      showToast(e.message || 'Verification failed', 'error')
    } finally {
      setVerifyingRuleId(null)
    }
  }

  const handleToggle = async (rule_id: string) => {
    await fetch('/api/constitution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', uid, rule_id }) })
    load()
  }

  const handleDelete = async (rule_id: string) => {
    if (!confirm('Remove this rule?')) return
    await fetch('/api/constitution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', uid, rule_id }) })
    showToast('Rule removed', 'success'); load()
  }

  // ── Validate against latest audit ──
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleValidate = async () => {
    setValidating(true)
    setValidationResult(null)
    try {
      // Load latest audit
      const verdictRes = await fetch(`/api/verdict?uid=${uid}`)
      const verdicts = await verdictRes.json()
      if (!Array.isArray(verdicts) || verdicts.length === 0) {
        showToast('No audit found. Run an audit first.', 'error')
        return
      }
      const latest = verdicts.sort((a: any, b: any) => b.createdAt - a.createdAt)[0]
      const res = await fetch('/api/constitution/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          byAttribute: latest.byAttribute ?? {},
          fairnessScore: latest.fairnessScore ?? 100,
          verdict: latest.verdict ?? 'CLEAR',
          severity: latest.severity ?? 'LOW',
        }),
      })
      const data = await res.json()
      setValidationResult(data)
      if (data.violationCount > 0) {
        showToast(`${data.violationCount} constitution rule${data.violationCount > 1 ? 's' : ''} violated — verdict downgraded to ${data.verdict}`, 'error')
      } else {
        showToast('All constitution rules passed!', 'success')
      }
    } catch (e: any) {
      showToast(e.message || 'Validation failed', 'error')
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="page-container-narrow fade-up">
      <div style={{ marginBottom: 40 }}>
        <div className="label" style={{ color: '#7c3aed' }}>Custom Rules</div>
        <h1 className="section-title" style={{ fontSize: 36, marginTop: 8, color: 'var(--navy)' }}>Fairness Constitution</h1>
        <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
          Define your organization's ethical rules in plain English. Gemini translates them into structured constraints applied to every future audit.
        </p>
      </div>

      {/* Add rule panel */}
      <div className="card fade-up delay-1" style={{ marginBottom: 24, borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ padding: 10, background: 'rgba(124,58,237,0.1)', borderRadius: 10 }}><Scale size={20} color="#7c3aed" /></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{editingRuleId ? 'Modify Rule' : 'Add a New Rule'}</h2>
        </div>
        <textarea
          value={ruleText}
          onChange={e => { setRuleText(e.target.value); setTranslated(null) }}
          placeholder='e.g. "Never reject female applicants at a higher rate than male applicants for equivalent credit scores."'
          rows={3}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button onClick={handleTranslate} disabled={translating || !ruleText.trim()} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#7c3aed', color: '#7c3aed' }}>
            {translating ? <Loader2 size={14} /> : <Sparkles size={14} />} Translate with AI
          </button>
          {translated && (
            <button onClick={handleSave} disabled={saving} className="btn" style={{ background: '#7c3aed', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <Loader2 size={14} /> : (editingRuleId ? <Edit2 size={14} /> : <Plus size={14} />)} {editingRuleId ? 'Update Rule' : 'Add to Constitution'}
            </button>
          )}
          {editingRuleId && (
            <button onClick={() => { setEditingRuleId(null); setRuleText(''); setTranslated(null) }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate)' }}>
              Cancel
            </button>
          )}
        </div>

        {/* Translated JSON preview */}
        {translated && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--navy)', borderRadius: 10, fontSize: 12, fontFamily: 'DM Mono, monospace', color: '#e2e8f0', lineHeight: 1.8, overflowX: 'auto' }}>
            <div style={{ color: '#94a3b8', marginBottom: 8, fontFamily: 'inherit' }}>// AI-translated constraint:</div>
            {[
              ['type', translated.type],
              ['attribute', translated.attribute],
              ['groups', JSON.stringify(translated.groups)],
              ['max_disparity', translated.max_disparity.toString()],
              ['applies_to', translated.applies_to],
              ['severity_if_violated', translated.severity_if_violated],
            ].map(([k, v]) => (
              <div key={k}><span style={{ color: '#a78bfa' }}>{k}</span>: <span style={{ color: '#fca5a5' }}>"{v}"</span></div>
            ))}
          </div>
        )}
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 60, color: 'var(--slate)' }}>
          <Scale size={40} color="var(--border)" style={{ margin: '0 auto 16px', display: 'block' }}/>
          No constitution rules yet. Add your first rule above.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Active Constitution — {rules.filter(r => r.active).length} of {rules.length} rules enforced
          </div>
          {rules.map(rule => (
            <div key={rule.rule_id} className="card fade-up" style={{ marginBottom: 14, opacity: rule.active ? 1 : 0.55, borderLeft: `3px solid ${SEVERITY_COLOR[rule.severity_if_violated] ?? 'var(--border)'}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${SEVERITY_COLOR[rule.severity_if_violated]}18`, color: SEVERITY_COLOR[rule.severity_if_violated] }}>{rule.severity_if_violated}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>{TYPE_LABEL[rule.type] ?? rule.type}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'var(--bg)', color: 'var(--slate)', border: '1px solid var(--border)' }}>{rule.attribute}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--navy)', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.5 }}>{rule.plain_english}</p>
                  <p style={{ fontSize: 12, color: 'var(--slate)', margin: 0 }}>
                    Max disparity: <strong>{(rule.max_disparity * 100).toFixed(0)}%</strong> · Groups: {rule.groups?.join(', ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => handleVerifySingle(rule)} disabled={verifyingRuleId === rule.rule_id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Verify rule against latest audit">
                    {verifyingRuleId === rule.rule_id ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                  </button>
                  <button onClick={() => handleEdit(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }} title="Modify rule">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleToggle(rule.rule_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.active ? '#7c3aed' : 'var(--slate)' }} title={rule.active ? 'Deactivate' : 'Activate'}>
                    {rule.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button onClick={() => handleDelete(rule.rule_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete rule">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Validate against latest audit */}
      {rules.filter(r => r.active).length > 0 && (
        <div className="card fade-up" style={{ marginTop: 24, border: '2px solid var(--teal)', background: 'var(--teal-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>⚖️ Validate Against Latest Audit</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>Run your active rules against your most recent audit result</div>
            </div>
            <button
              onClick={handleValidate} disabled={validating}
              className="btn btn-teal" style={{ gap: 6 }}
            >
              {validating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Scale size={14} />}
              {validating ? 'Validating…' : 'Run Validation'}
            </button>
          </div>

          {validationResult && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
                background: validationResult.violationCount > 0 ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${validationResult.violationCount > 0 ? '#fca5a5' : '#bbf7d0'}`,
                marginBottom: validationResult.violationCount > 0 ? 12 : 0,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: validationResult.violationCount > 0 ? '#dc2626' : '#16a34a' }}>
                    {validationResult.summary}
                  </div>
                  {validationResult.originalVerdict !== validationResult.verdict && (
                    <div style={{ fontSize: 13, marginTop: 4, color: '#374151' }}>
                      Verdict: <strong style={{ color: '#dc2626' }}>{validationResult.originalVerdict} → {validationResult.verdict}</strong>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: validationResult.violationCount > 0 ? '#dc2626' : '#16a34a' }}>{validationResult.violationCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)' }}>violations</div>
                </div>
              </div>
              {validationResult.violations?.map((v: any, i: number) => (
                <div key={i} style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, marginBottom: 6, border: '1px solid #fca5a5' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>Rule violated: {v.attribute} · {v.metric}</div>
                  <div style={{ fontSize: 12, color: '#374151', marginTop: 2 }}>{v.plain_english}</div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 2 }}>Actual: {v.actual_value} · Threshold: {v.threshold}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 24, textAlign: 'center' }}>
        These rules apply to all future FairSight audits. A CLEAR verdict will be downgraded to BORDERLINE if any active rule is violated.
        {' '}<a href="/dashboard" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 700 }}>← Back to Dashboard</a>
      </p>
    </div>
  )
}

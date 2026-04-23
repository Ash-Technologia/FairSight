'use client'
import { useState, useEffect } from 'react'
import { X, Check, Copy } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

interface DevHubModalProps {
  onClose: () => void
  apiKey?: string
}

export function DevHubModal({ onClose, apiKey: initialApiKey }: DevHubModalProps) {
  const [activeTab, setActiveTab] = useState<'python' | 'fastapi' | 'jupyter'>('python')
  const [copied, setCopied] = useState(false)
  
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState(initialApiKey || 'fs_live_your-api-key-here')
  const protectedAttrs = '["race", "gender"]'
  const biasThreshold = '70'
  const webhookUrl = 'https://hooks.slack.com/your-webhook'

  // Fetch true API key if none passed
  useEffect(() => {
    if (initialApiKey || !user?.uid) return
    fetch(`/api/apikeys?uid=${user.uid}`)
      .then(res => res.json())
      .then(data => {
        if (data.keys?.[0]) setApiKey(data.keys[0].key_prefix + '...' + data.keys[0].key_suffix)
      })
      .catch(() => {})
  }, [user, initialApiKey])

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TABS = [
    { id: 'python', label: 'Python / scikit-learn' },
    { id: 'fastapi', label: 'FastAPI Integration' },
    { id: 'jupyter', label: 'Jupyter Notebook' }
  ]

  const snippets = {
    python: `# FairSight SDK — Python Integration
# Generated for: ${user?.email || 'Your Account'}
# API Key: ${apiKey}
# Generated: ${new Date().toLocaleDateString()}

from fairsight import FairSight

# Initialize with your API key
fs = FairSight(
    api_key="` + apiKey + `",
    protected_attributes=` + protectedAttrs + `,
    bias_threshold=` + biasThreshold + `,
    alert_on_bias=True,
)

# Wrap your existing model — zero architecture change
# Replace: prediction = model.predict(X)
# With:
prediction = fs.predict(
    model=your_sklearn_model,
    X=X_test,
    record_id="optional-unique-id",  # for audit trail
)

# Get the latest verdict
verdict = fs.last_verdict()
print(f"Fairness score: {verdict.fairness_score}/100")
print(f"Verdict: {verdict.overall_verdict}")

# Run a full audit on a dataset
audit = fs.audit_dataset(
    filepath="your_dataset.csv",
    label_col="true_label",
)
print(f"Audit ID: {audit.id}")
print(f"Report: https://fairsight.app/audit/{audit.id}")`,

    fastapi: `# FairSight SDK — FastAPI Middleware
# Automatically audits every prediction endpoint

from fastapi import FastAPI
from fairsight.middleware import FairSightMiddleware

app = FastAPI()

# Add FairSight as middleware — audits all /predict routes
app.add_middleware(
    FairSightMiddleware,
    api_key="` + apiKey + `",
    protected_attributes=` + protectedAttrs + `,
    audit_routes=["/predict", "/score", "/recommend"],
    webhook_url="` + webhookUrl + `",
    bias_threshold=` + biasThreshold + `,
)

@app.post("/predict")
async def predict(data: dict):
    # Your existing prediction logic — FairSight wraps it automatically
    prediction = your_model.predict(data)
    return {"prediction": prediction}
    # FairSight intercepts this response, checks for bias,
    # and fires your Slack webhook if fairness_score < ${biasThreshold}`,

    jupyter: `# FairSight SDK — Jupyter Notebook Quick Start
# Cell 1: Install

# !pip install fairsight-sdk pandas

# Cell 2: Import and configure

from fairsight import FairSight
import pandas as pd

fs = FairSight(api_key="` + apiKey + `")

# Cell 3: Audit your dataset

df = pd.read_csv("your_dataset.csv")

audit = fs.audit_dataframe(
    df=df,
    protected_attributes=` + protectedAttrs + `,
    target_col="predicted_label",
    label_col="true_label",
)

# Cell 4: View results

print(f"Fairness Score: {audit.fairness_score}/100")
print(f"Verdict: {audit.overall_verdict}")
print(f"Biased attributes: {audit.biased_attributes}")

# Display inline (renders in Jupyter)
audit.display()

# Cell 5: Export debiased dataset

debiased_df = audit.debias()
debiased_df.to_csv("debiased_dataset.csv", index=False)
print(f"Debiased dataset saved. New score: {audit.debiased_fairness_score}/100")`
  }

  // Pure regex highlighting syntax
  const highlightCode = (code: string) => {
    return code
      .replace(/^(#.*)$/gm, '<span class="c-comment">$1</span>')
      .replace(/(import|from|print|async|def|await|return|class|if|try|except)\b/g, '<span class="c-keyword">$1</span>')
      .replace(/(fs_live_[a-zA-Z0-9.\-]+|\["race", "gender"\]|["'][a-zA-Z0-9=:\/.\-_]*["'])/g, match => {
        if (match.includes('fs_live_') || match.includes('race')) {
          return `<span class="c-value">${match}</span>`
        }
        return `<span class="c-string">${match}</span>`
      })
      .replace(/\s(FairSight|FairSightMiddleware|FastAPI|pd)\b/g, ' <span class="c-function">$1</span>')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)',
      padding: 24
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 860,
        boxShadow: '0 24px 48px rgba(0,0,0,0.3)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--navy)' }}>Developer Hub</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate)' }}>Integrate FairSight SDK directly into your ML pipelines.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--slate)' }}><X size={20} /></button>
        </div>

        {apiKey === 'fs_live_your-api-key-here' && (
          <div style={{ background: 'var(--orange-dim)', padding: '10px 24px', borderBottom: '1px solid var(--orange)', fontSize: 13, color: 'var(--orange-strong)' }}>
            <strong>⚠ No API key found.</strong> Go to <a href="/settings/api-keys" style={{ color: 'inherit', textDecoration: 'underline' }}>Settings &gt; API Keys</a> to generate one, replacing the placeholder below.
          </div>
        )}

        {/* Content */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '14px 20px', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #334155' }}>
            <span style={{ color: '#e2e8f0', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>pip install fairsight-sdk</span>
            <button 
              onClick={() => copyText('pip install fairsight-sdk')}
              style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center' }}
            >
              <Copy size={12} /> Copy
            </button>
          </div>

          <div style={{ display: 'flex', background: '#1e293b' }}>
            {TABS.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ 
                  flex: 1, padding: 12, background: activeTab === tab.id ? '#0f1f35' : 'transparent',
                  border: 'none', color: activeTab === tab.id ? '#38bdf8' : '#94a3b8', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', borderTop: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <pre className="code-block" style={{ margin: 0, borderRadius: '0 0 12px 12px', minHeight: 300, background: '#0f1f35', color: '#e2e8f0', padding: 24, fontSize: 13, borderTop: 'none' }} dangerouslySetInnerHTML={{ __html: highlightCode(snippets[activeTab]) }} />
            
            <button 
              onClick={() => copyText(snippets[activeTab])}
              style={{ position: 'absolute', top: 16, right: 16, background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <Check size={14} color="#4ade80" /> : <Copy size={14} />} 
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}

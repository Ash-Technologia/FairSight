// frontend/app/api/badge/[orgId]/route.ts
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

function buildSvg(score: number, verdict: string): string {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" role="img" aria-label="FairSight: ${score}/100">
  <title>FairSight: ${score}/100</title>
  <clipPath id="r"><rect width="200" height="28" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="130" height="28" fill="#0f1f35"/>
    <rect x="130" width="70" height="28" fill="${color}"/>
  </g>
  <g fill="#fff" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="10" y="18" fill="#fff">FairSight Certified</text>
    <text x="138" y="18" font-weight="bold">${score}/100</text>
  </g>
</svg>`
}

function notAuditedSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" role="img">
  <title>FairSight: Not Audited</title>
  <clipPath id="r"><rect width="200" height="28" rx="4" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="130" height="28" fill="#0f1f35"/>
    <rect x="130" width="70" height="28" fill="#64748b"/>
  </g>
  <g fill="#fff" font-family="DejaVu Sans,sans-serif" font-size="11">
    <text x="10" y="18" fill="#fff">FairSight Certified</text>
    <text x="136" y="18" font-weight="bold">Not audited</text>
  </g>
</svg>`
}

export async function GET(_req: Request, { params }: { params: { orgId: string } }) {
  const headers = { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' }
  const { orgId } = params

  if (!orgId) return new Response(notAuditedSvg(), { headers })

  let score = 0
  let verdict = 'UNKNOWN'
  let found = false

  // Try Firestore
  try {
    if (db) {
      const q = query(collection(db, 'audits'), where('uid', '==', orgId), orderBy('createdAt', 'desc'), limit(1))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const doc = snap.docs[0].data()
        score = doc.fairnessScore ?? 0
        verdict = doc.verdict ?? 'UNKNOWN'
        found = true
      }
    }
  } catch { /* fall through to local cache */ }

  // Try local cache
  if (!found) {
    try {
      const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
      if (fs.existsSync(cachePath)) {
        const cache: any[] = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
        const match = cache.find(a => a.uid === orgId)
        if (match) { score = match.fairnessScore ?? 0; verdict = match.verdict ?? 'UNKNOWN'; found = true }
      }
    } catch { /* ignore */ }
  }

  if (!found) return new Response(notAuditedSvg(), { headers })
  return new Response(buildSvg(score, verdict), { headers })
}

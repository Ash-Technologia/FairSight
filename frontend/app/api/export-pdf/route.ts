// app/api/export-pdf/route.ts
import { AuditRecord } from '@/lib/types'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (!id) {
    return Response.json({ error: 'Audit ID required' }, { status: 400 })
  }

  // Fetch the audit data
  let audit: AuditRecord | null = null
  try {
    const verdictRes = await fetch(`${url.origin}/api/verdict?id=${id}`)
    audit = await verdictRes.json()
  } catch {
    return Response.json({ error: 'Could not fetch audit data' }, { status: 500 })
  }

  if (!audit) {
    return Response.json({ error: 'Audit not found' }, { status: 404 })
  }

  // Generate PDF content as HTML for jsPDF on client
  // Return structured data; actual PDF generation happens client-side
  return Response.json({
    auditId: id,
    title: `FairSight Audit Report — ${audit.filename}`,
    date: new Date(audit.createdAt).toLocaleDateString(),
    verdict: audit.verdict,
    fairnessScore: audit.fairnessScore,
    summary: audit.aiVerdict,
    rootCause: audit.rootCause,
    metrics: audit.metrics,
    mitigations: audit.mitigations,
    datasetHash: audit.datasetHash,
    exportedAt: new Date().toISOString(),
  })
}

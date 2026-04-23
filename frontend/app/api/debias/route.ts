const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function POST(req: Request) {
  const url = new URL(req.url)
  const auditId = url.searchParams.get('id')
  if (!auditId) return Response.json({ error: 'id required' }, { status: 400 })

  const body = await req.json()
  const res = await fetch(`${BACKEND}/debias/${auditId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return Response.json(data, { status: res.status })
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const auditId = url.searchParams.get('id')
  if (!auditId) return Response.json({ error: 'id required' }, { status: 400 })

  const res = await fetch(`${BACKEND}/debias/${auditId}/download`)
  if (!res.ok) return Response.json({ error: 'Download failed' }, { status: res.status })

  const csvText = await res.text()
  return new Response(csvText, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=fairsight_debiased_${auditId.slice(0, 8)}.csv`,
    },
  })
}

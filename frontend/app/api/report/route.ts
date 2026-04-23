// frontend/app/api/report/route.ts
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const res  = await fetch(`${BACKEND}/report/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      return Response.json({ error: text }, { status: res.status })
    }
    const pdfBytes = await res.arrayBuffer()
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': res.headers.get('Content-Disposition') || 'attachment; filename="report.pdf"',
      },
    })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 })
  }
}

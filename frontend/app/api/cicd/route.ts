// frontend/app/api/cicd/route.ts
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const uid       = searchParams.get('uid') || 'guest'
  const threshold = searchParams.get('threshold') || '80'
  const action    = searchParams.get('action') // 'badge'

  const path = action === 'badge'
    ? `/cicd/badge?uid=${uid}&threshold=${threshold}`
    : `/cicd/gate?uid=${uid}&threshold=${threshold}`

  try {
    const res = await fetch(`${BACKEND}${path}`, { cache: 'no-store' })
    if (action === 'badge') {
      const svg = await res.text()
      return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } })
    }
    return Response.json(await res.json())
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 })
  }
}

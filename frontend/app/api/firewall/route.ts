// frontend/app/api/firewall/route.ts
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') // 'log' | 'stats'
  const path   = action === 'log' ? '/log' : action === 'stats' ? '/stats' : '/stats'
  try {
    const res  = await fetch(`${BACKEND}/firewall${path}`, { cache: 'no-store' })
    return Response.json(await res.json())
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const res  = await fetch(`${BACKEND}/firewall/intercept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return Response.json(await res.json(), { status: res.status })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 })
  }
}

// app/api/benchmark/route.ts
const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const id     = searchParams.get('id')
  const action = searchParams.get('action')  // 'index' for fairness index

  let url = `${BACKEND}/benchmark/`
  if (action === 'index') url = `${BACKEND}/benchmark/index/summary`
  else if (id)            url = `${BACKEND}/benchmark/${id}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text()
      return Response.json({ error: text }, { status: res.status })
    }
    const data = await res.json()
    return Response.json(data)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Dataset id required' }, { status: 400 })

  try {
    const res = await fetch(`${BACKEND}/benchmark/${id}/audit`, { method: 'POST' })
    if (!res.ok) {
      const text = await res.text()
      return Response.json({ error: text }, { status: res.status })
    }
    return Response.json(await res.json())
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 502 })
  }
}

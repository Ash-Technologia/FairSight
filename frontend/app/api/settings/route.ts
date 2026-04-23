// frontend/app/api/settings/route.ts
// Proxy to backend /settings/webhooks — keeps backend URL server-side only

import { NextRequest } from 'next/server'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  try {
    const res = await fetch(`${BACKEND}/settings/webhooks?uid=${uid}`)
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND}/settings/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'Backend unavailable' }, { status: 502 })
  }
}

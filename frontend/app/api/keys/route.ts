// frontend/app/api/keys/route.ts
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import fs from 'fs'
import path from 'path'

const KEYS_CACHE = path.join(process.cwd(), '.fairsight_api_keys.json')

function loadLocalKeys(): any[] {
  try { if (fs.existsSync(KEYS_CACHE)) return JSON.parse(fs.readFileSync(KEYS_CACHE, 'utf-8')) } catch {}
  return []
}
function saveLocalKeys(keys: any[]) {
  fs.writeFileSync(KEYS_CACHE, JSON.stringify(keys, null, 2))
}

function generateKey(): { full: string; prefix: string; hash: string } {
  const raw = randomBytes(18).toString('base64url').slice(0, 24)
  const full = `fs_live_${raw}`
  const prefix = full.slice(0, 15)
  const hash = createHash('sha256').update(full).digest('hex')
  return { full, prefix, hash }
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid') ?? 'guest'
  let keys = loadLocalKeys().filter((k: any) => k.uid === uid && !k.revoked)
  return Response.json(keys.map((k: any) => ({ ...k, key_hash: undefined })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { uid, label } = body

  if (!uid) return Response.json({ error: 'uid required' }, { status: 400 })

  const { full, prefix, hash } = generateKey()
  const newKey = {
    id: `key_${Date.now()}`,
    uid,
    label: label || 'Default',
    key_prefix: prefix,
    key_hash: hash,
    created_at: new Date().toISOString(),
    last_used: null,
    revoked: false,
    monthly_quota: 100000,
    events_this_month: 0,
  }

  const allKeys = loadLocalKeys()
  allKeys.push(newKey)
  saveLocalKeys(allKeys)

  // Return full key ONCE only
  return Response.json({ ...newKey, full_key: full, key_hash: undefined })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  const allKeys = loadLocalKeys()
  const idx = allKeys.findIndex((k: any) => k.id === id)
  if (idx !== -1) { allKeys[idx].revoked = true; saveLocalKeys(allKeys) }
  return Response.json({ status: 'revoked' })
}

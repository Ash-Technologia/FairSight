// frontend/app/api/feedback/route.ts
//
// Stores human feedback on audit accuracy to Firestore.
// If Firestore is unavailable, falls back to local JSON cache.
// Never modifies existing audit documents.

import { NextRequest } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { auditId, rating, issue_type, comment } = body

    if (!auditId) {
      return Response.json({ error: 'auditId is required' }, { status: 400 })
    }
    if (!['positive', 'negative'].includes(rating)) {
      return Response.json({ error: 'rating must be "positive" or "negative"' }, { status: 400 })
    }

    const doc = {
      auditId,
      rating,          // 'positive' | 'negative'
      issue_type: issue_type ?? null,  // null | 'severity' | 'proxy' | 'mitigation' | 'explanation'
      comment: comment ?? '',
      timestamp: Date.now(),
    }

    let feedbackId = `fb-${Date.now()}`

    try {
      if (!db) throw new Error('Firestore not initialized')
      const ref = await addDoc(collection(db, 'feedback'), doc)
      feedbackId = ref.id
    } catch {
      // Firestore unavailable — write to local cache
      const cachePath = path.join(process.cwd(), '.fairsight_feedback.json')
      let cache: any[] = []
      try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) } catch {}
      cache.unshift({ id: feedbackId, ...doc })
      if (cache.length > 500) cache = cache.slice(0, 500)
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
    }

    return Response.json({ success: true, feedbackId })
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Unknown error' }, { status: 500 })
  }
}

// GET — returns confidence score for a given auditId
// confidence = positive_count / total_feedback (0–1)
export async function GET(req: NextRequest) {
  const auditId = req.nextUrl.searchParams.get('auditId')
  if (!auditId) {
    return Response.json({ error: 'auditId query param required' }, { status: 400 })
  }

  try {
    // Read from local cache (Firestore query would require server-side admin SDK)
    const cachePath = path.join(process.cwd(), '.fairsight_feedback.json')
    let cache: any[] = []
    try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) } catch {}

    const forAudit = cache.filter((f: any) => f.auditId === auditId)
    const positives = forAudit.filter((f: any) => f.rating === 'positive').length
    const total = forAudit.length

    return Response.json({
      auditId,
      total_feedback: total,
      positive_count: positives,
      confidence_score: total > 0 ? parseFloat((positives / total).toFixed(2)) : null,
    })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

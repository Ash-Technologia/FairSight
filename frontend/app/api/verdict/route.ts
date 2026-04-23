import { db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc, query, orderBy, limit, where, deleteDoc } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const uid = url.searchParams.get('uid')

  // Fallback to local cache if no Firebase
  const checkLocalCache = () => {
    const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
      if (id) {
        return cache.find((a: any) => a.id === id) || { error: 'Report not found' }
      }
      if (uid && uid !== 'guest') {
        return cache.filter((a: any) => a.uid === uid).sort((a: any, b: any) => b.createdAt - a.createdAt)
      }
      return cache.sort((a: any, b: any) => b.createdAt - a.createdAt)
    }
    return id ? { error: 'Report not found' } : []
  }

  if (id) {
    try {
      if (!db) throw new Error('No DB')
      const docSnap = await getDoc(doc(db, 'audits', id))
      if (!docSnap.exists()) return Response.json(checkLocalCache())
      
      const data = docSnap.data()
      return Response.json({ id: docSnap.id, ...data, createdAt: data.createdAt?.toMillis?.() || Date.now() })
    } catch {
      return Response.json(checkLocalCache())
    }
  } else {
    try {
      if (!db) throw new Error('No DB')
      const constraints: any[] = []
      if (uid && uid !== 'guest') constraints.push(where('uid', '==', uid))
      constraints.push(orderBy('createdAt', 'desc'), limit(20))
      
      const q = query(collection(db, 'audits'), ...constraints)
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) return Response.json(checkLocalCache())

      const audits = snapshot.docs.map(d => ({
        id: d.id, ...d.data(), createdAt: d.data().createdAt?.toMillis?.() || Date.now()
      }))
      return Response.json(audits)
    } catch {
      return Response.json(checkLocalCache())
    }
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  
  if (!id) return Response.json({ error: 'Missing ID' }, { status: 400 })
  
  try {
    if (!db) throw new Error('No DB')
    await deleteDoc(doc(db, 'audits', id))
    return Response.json({ success: true })
  } catch (err: any) {
    const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
    if (fs.existsSync(cachePath)) {
      let cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
      cache = cache.filter((a: any) => a.id !== id)
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2))
      return Response.json({ success: true, local: true })
    }
    return Response.json({ error: err.message }, { status: 500 })
  }
}

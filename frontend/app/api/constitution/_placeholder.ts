# frontend/app/api/constitution/route.ts
# Fixed: In-memory store (works on Vercel serverless) + file fallback for localhost
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'


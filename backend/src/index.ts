import express from 'express'
import path from 'path'
import helmet from 'helmet'
import dotenv from 'dotenv'
import formRoutes from './routes/forms'
import submissionRoutes from './routes/submissions'
import metaRoutes from './routes/meta'
import settingsRoutes from './routes/settings'
import corsMiddleware from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { seedDefaultSettings, getSettings } from './services/settingsService'
import prisma from './prisma/client'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const isProduction = process.env.NODE_ENV === 'production'

app.use(helmet({ contentSecurityPolicy: false }))
app.use(corsMiddleware)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

if (isProduction) {
  app.use(express.static(path.join(__dirname, '../public')))
}

app.get('/api/health', async (_req, res) => {
  let dbConnected = false
  let dbError: string | null = null
  try {
    await prisma.$queryRaw`SELECT 1`
    dbConnected = true
  } catch (e: any) {
    dbError = e.message
  }
  let capiPixelId = false
  let capiAccessToken = false
  try {
    const settings = await getSettings()
    capiPixelId = !!settings.meta_pixel_id
    capiAccessToken = !!settings.meta_access_token
  } catch {}
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    dbConfigured: !!process.env.DATABASE_URL,
    dbConnected,
    dbError,
    capiConfigured: capiPixelId && capiAccessToken,
    capi: { hasPixelId: capiPixelId, hasAccessToken: capiAccessToken }
  })
})

app.use('/api/forms', formRoutes)
app.use('/api/submissions', submissionRoutes)
app.use('/api/meta', metaRoutes)
app.use('/api/settings', settingsRoutes)

if (isProduction) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'))
  })
} else {
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    })
  })
}

app.use(errorHandler)

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  await seedDefaultSettings()
})

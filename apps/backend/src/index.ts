import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import express from 'express'
import { closeDb, getDb } from './db.js'
import { initQueryRegistry } from './lib/query-registry.js'
import { errorHandler } from './middleware/error.js'
import { analysisRouter } from './routes/analysis.js'
import { dashboardRouter } from './routes/dashboard.js'
import { graphRouter } from './routes/graph.js'
import { packagesRouter } from './routes/packages.js'
import { searchRouter } from './routes/search.js'
import { sourceRouter } from './routes/source.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const port = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/dashboard', dashboardRouter)
app.use('/api/packages', packagesRouter)
app.use('/api/graph', graphRouter)
app.use('/api/source', sourceRouter)
app.use('/api/search', searchRouter)
app.use('/api/analysis', analysisRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Serve frontend static files in production
const frontendPaths = [
  resolve(__dirname, '../frontend/dist'),       // Docker layout
  resolve(__dirname, '../../frontend/dist')     // Monorepo dev layout
]
const frontendDist = frontendPaths.find(p => existsSync(p))
if (frontendDist) {
  console.log(`Serving frontend from ${frontendDist}`)
  app.use(express.static(frontendDist))
  app.get('{*path}', (_req, res) => {
    res.sendFile(resolve(frontendDist, 'index.html'))
  })
}

app.use(errorHandler)

// Initialize database and start server
try {
  getDb()
  console.log('Database connected')
  initQueryRegistry()
} catch (err) {
  console.error('Failed to connect to database:', err)
  console.log('Server will start without database - some endpoints will fail')
}

app.listen(port, () => {
  console.log(`CPG Explorer backend running on http://localhost:${port}`)
})

process.on('SIGINT', () => {
  closeDb()
  process.exit(0)
})

process.on('SIGTERM', () => {
  closeDb()
  process.exit(0)
})

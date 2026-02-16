import { Router } from 'express'
import { getDb } from '../db.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.use(cacheMiddleware())

router.get('/findings', (req, res) => {
  const db = getDb()
  const category = req.query.category as string
  const severity = req.query.severity as string
  const limit = Math.min(Number(req.query.limit) || 50, 500)

  let sql = 'SELECT * FROM findings WHERE 1=1'
  const params: unknown[] = []

  if (category) {
    sql += ' AND category = ?'
    params.push(category)
  }
  if (severity) {
    sql += ' AND severity = ?'
    params.push(severity)
  }

  sql += ' ORDER BY severity DESC, category LIMIT ?'
  params.push(limit)

  const rows = db.prepare(sql).all(...params)
  res.json({ data: rows })
})

router.get('/error-chains', (req, res) => {
  const db = getDb()
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const rows = db.prepare('SELECT * FROM error_chains ORDER BY chain_depth DESC LIMIT ?').all(limit)
  res.json({ data: rows })
})

router.get('/go-patterns', (_req, res) => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM go_pattern_summary ORDER BY goroutine_count DESC').all()
  res.json({ data: rows })
})

export { router as analysisRouter }

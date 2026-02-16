import { type Request, type Response, Router } from 'express'
import { getDb } from '../db.js'
import { cacheMiddleware } from '../middleware/cache.js'

const router = Router()

router.use(cacheMiddleware())

const simpleQuery = (sql: string) => (_req: Request, res: Response) => {
  const rows = getDb().prepare(sql).all()
  res.json({ data: rows })
}

router.get('/overview', simpleQuery('SELECT key, value FROM dashboard_overview'))
router.get('/complexity-distribution', simpleQuery('SELECT bucket, bucket_min, bucket_max, function_count FROM dashboard_complexity_distribution'))
router.get('/findings-summary', simpleQuery('SELECT category, severity, count FROM dashboard_findings_summary ORDER BY count DESC'))
router.get('/node-distribution', simpleQuery('SELECT node_kind, count, percentage FROM dashboard_node_distribution ORDER BY count DESC'))
router.get('/edge-distribution', simpleQuery('SELECT edge_kind, count, percentage FROM dashboard_edge_distribution ORDER BY count DESC'))

router.get('/hotspots', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const rows = getDb().prepare('SELECT * FROM dashboard_hotspots ORDER BY hotspot_score DESC LIMIT ?').all(limit)
  res.json({ data: rows })
})

router.get('/top-functions', (req, res) => {
  const metric = (req.query.metric as string) || 'complexity'
  const allowedMetrics = ['complexity', 'loc', 'fan_in', 'fan_out']
  if (!allowedMetrics.includes(metric)) {
    res.status(400).json({ error: `Invalid metric. Allowed: ${allowedMetrics.join(', ')}` })
    return
  }
  const rows = getDb().prepare('SELECT * FROM dashboard_top_functions WHERE metric = ? ORDER BY rank').all(metric)
  res.json({ data: rows })
})

router.get('/file-heatmap', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200)
  const rows = getDb().prepare('SELECT * FROM dashboard_file_heatmap ORDER BY hotspot_score DESC LIMIT ?').all(limit)
  res.json({ data: rows })
})

router.get('/complexity-vs-loc', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500)
  const rows = getDb().prepare('SELECT * FROM dashboard_complexity_vs_loc ORDER BY complexity DESC LIMIT ?').all(limit)
  res.json({ data: rows })
})

export { router as dashboardRouter }

import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/symbol', (req, res) => {
  const db = getDb()
  const q = req.query.q as string
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const kind = req.query.kind as string

  if (!q || q.length < 2) {
    res.status(400).json({ error: 'q parameter must be at least 2 characters' })
    return
  }

  const pattern = `%${q}%`

  if (kind) {
    const rows = db.prepare(
      'SELECT id, name, kind, package, file, line, signature, parent FROM symbol_index WHERE name LIKE ? AND kind = ? ORDER BY name LIMIT ?'
    ).all(pattern, kind, limit)
    res.json({ data: rows })
  } else {
    const rows = db.prepare(
      'SELECT id, name, kind, package, file, line, signature, parent FROM symbol_index WHERE name LIKE ? ORDER BY name LIMIT ?'
    ).all(pattern, limit)
    res.json({ data: rows })
  }
})

router.get('/xref', (req, res) => {
  const db = getDb()
  const id = req.query.id as string

  if (!id) {
    res.status(400).json({ error: 'id parameter is required' })
    return
  }

  const rows = db.prepare(
    'SELECT * FROM xrefs WHERE def_id = ? OR def_name = ? ORDER BY use_file, use_line'
  ).all(id, id)

  res.json({ data: rows })
})

export { router as searchRouter }

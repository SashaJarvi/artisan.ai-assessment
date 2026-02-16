import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const file = req.query.file as string

  if (!file) {
    res.status(400).json({ error: 'file parameter is required' })
    return
  }

  const row = db.prepare('SELECT file, content, package FROM sources WHERE file = ?').get(file) as
    | { file: string; content: string; package: string }
    | undefined

  if (!row) {
    res.status(404).json({ error: 'File not found' })
    return
  }

  res.json({ data: row })
})

router.get('/outline', (req, res) => {
  const db = getDb()
  const file = req.query.file as string

  if (!file) {
    res.status(400).json({ error: 'file parameter is required' })
    return
  }

  const rows = db.prepare(
    'SELECT * FROM file_outline WHERE file = ? ORDER BY line'
  ).all(file)

  res.json({ data: rows })
})

router.get('/files', (req, res) => {
  const db = getDb()
  const pkg = req.query.package as string

  if (pkg) {
    const rows = db.prepare('SELECT file, package FROM sources WHERE package = ? ORDER BY file').all(pkg)
    res.json({ data: rows })
  } else {
    const rows = db.prepare('SELECT file, package FROM sources ORDER BY file').all()
    res.json({ data: rows })
  }
})

export { router as sourceRouter }

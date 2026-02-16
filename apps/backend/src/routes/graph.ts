import { Router } from 'express'
import { getDb } from '../db.js'
import { buildGraphResponse, transformEdges, transformNodes } from '../lib/graph-transform.js'

const router = Router()

router.get('/call-chain', (req, res) => {
  const db = getDb()
  const functionId = req.query.function as string
  const depth = Math.min(Number(req.query.depth) || 3, 10)
  const maxNodes = Math.min(Number(req.query.max_nodes) || 60, 200)

  if (!functionId) {
    res.status(400).json({ error: 'function parameter is required' })
    return
  }

  const nodeRows = db.prepare(`
    WITH RECURSIVE chain(id, depth, path) AS (
      SELECT ?, 0, ?
      UNION
      SELECT e.target, c.depth + 1, c.path || ' -> ' || e.target
      FROM chain c JOIN edges e ON e.source = c.id
      WHERE e.kind = 'call' AND c.depth < ?
        AND c.path NOT LIKE '%' || e.target || '%'
    )
    SELECT DISTINCT n.* FROM chain c JOIN nodes n ON n.id = c.id
  `).all(functionId, functionId, depth)

  const nodeIds = new Set(nodeRows.map((r: any) => r.id))
  const edgeRows = db.prepare(`
    SELECT source, target, kind FROM edges
    WHERE kind = 'call' AND source IN (${Array.from(nodeIds).map(() => '?').join(',')})
      AND target IN (${Array.from(nodeIds).map(() => '?').join(',')})
  `).all(...Array.from(nodeIds), ...Array.from(nodeIds))

  const nodes = transformNodes(nodeRows as any[])
  const edges = transformEdges(edgeRows as any[])
  res.json(buildGraphResponse(nodes, edges, maxNodes))
})

router.get('/callers', (req, res) => {
  const db = getDb()
  const functionId = req.query.function as string
  const depth = Math.min(Number(req.query.depth) || 3, 5)
  const maxNodes = Math.min(Number(req.query.max_nodes) || 60, 200)

  if (!functionId) {
    res.status(400).json({ error: 'function parameter is required' })
    return
  }

  const nodeRows = db.prepare(`
    WITH RECURSIVE callers(id, depth) AS (
      SELECT ?, 0
      UNION
      SELECT e.source, c.depth + 1
      FROM callers c JOIN edges e ON e.target = c.id
      WHERE e.kind = 'call' AND c.depth < ?
    )
    SELECT DISTINCT n.* FROM callers c JOIN nodes n ON n.id = c.id
    WHERE n.kind = 'function'
  `).all(functionId, depth)

  const nodeIds = new Set(nodeRows.map((r: any) => r.id))
  const edgeRows = db.prepare(`
    SELECT source, target, kind FROM edges
    WHERE kind = 'call' AND source IN (${Array.from(nodeIds).map(() => '?').join(',')})
      AND target IN (${Array.from(nodeIds).map(() => '?').join(',')})
  `).all(...Array.from(nodeIds), ...Array.from(nodeIds))

  const nodes = transformNodes(nodeRows as any[])
  const edges = transformEdges(edgeRows as any[])
  res.json(buildGraphResponse(nodes, edges, maxNodes))
})

router.get('/neighborhood', (req, res) => {
  const db = getDb()
  const nodeId = req.query.node_id as string
  const depth = Math.min(Number(req.query.depth) || 1, 3)
  const edgeKinds = ((req.query.edge_kinds as string) || 'call').split(',')
  const maxNodes = Math.min(Number(req.query.max_nodes) || 60, 200)

  if (!nodeId) {
    res.status(400).json({ error: 'node_id parameter is required' })
    return
  }

  const kindPlaceholders = edgeKinds.map(() => '?').join(',')
  const nodeRows = db.prepare(`
    WITH RECURSIVE neighborhood(id, depth) AS (
      SELECT ?, 0
      UNION
      SELECT e.target, nb.depth + 1
      FROM neighborhood nb JOIN edges e ON e.source = nb.id
      WHERE e.kind IN (${kindPlaceholders}) AND nb.depth < ?
      UNION
      SELECT e.source, nb.depth + 1
      FROM neighborhood nb JOIN edges e ON e.target = nb.id
      WHERE e.kind IN (${kindPlaceholders}) AND nb.depth < ?
    )
    SELECT DISTINCT n.* FROM neighborhood nb JOIN nodes n ON n.id = nb.id
  `).all(nodeId, ...edgeKinds, depth, ...edgeKinds, depth)

  const nodeIds = new Set(nodeRows.map((r: any) => r.id))
  const edgeRows = db.prepare(`
    SELECT source, target, kind FROM edges
    WHERE kind IN (${kindPlaceholders})
      AND source IN (${Array.from(nodeIds).map(() => '?').join(',')})
      AND target IN (${Array.from(nodeIds).map(() => '?').join(',')})
  `).all(...edgeKinds, ...Array.from(nodeIds), ...Array.from(nodeIds))

  const nodes = transformNodes(nodeRows as any[])
  const edges = transformEdges(edgeRows as any[])
  res.json(buildGraphResponse(nodes, edges, maxNodes))
})

router.get('/cfg', (req, res) => {
  const db = getDb()
  const functionId = req.query.function as string

  if (!functionId) {
    res.status(400).json({ error: 'function parameter is required' })
    return
  }

  const rows = db.prepare(`
    SELECT
      bb.id AS block_id, bb.name AS block_name, bb.line AS block_line,
      e.target AS successor_id, n2.name AS successor_name,
      ep.value AS branch_label
    FROM nodes bb
    JOIN edges parent_e ON parent_e.target = bb.id AND parent_e.kind = 'ast'
    LEFT JOIN edges e ON e.source = bb.id AND e.kind = 'cfg'
    LEFT JOIN nodes n2 ON e.target = n2.id
    LEFT JOIN edge_properties ep ON ep.source = e.source AND ep.target = e.target
      AND ep.edge_kind = 'cfg' AND ep.key = 'label'
    WHERE bb.kind = 'basic_block' AND parent_e.source = ?
    ORDER BY bb.line
  `).all(functionId)

  const nodeMap = new Map<string, any>()
  const edgeList: any[] = []

  for (const row of rows as any[]) {
    if (!nodeMap.has(row.block_id)) {
      nodeMap.set(row.block_id, {
        data: {
          id: row.block_id,
          label: row.block_name || `BB@${row.block_line}`,
          kind: 'basic_block',
          line: row.block_line
        },
        classes: 'basic_block'
      })
    }
    if (row.successor_id && !nodeMap.has(row.successor_id)) {
      nodeMap.set(row.successor_id, {
        data: {
          id: row.successor_id,
          label: row.successor_name || 'BB',
          kind: 'basic_block'
        },
        classes: 'basic_block'
      })
    }
    if (row.successor_id) {
      edgeList.push({
        data: {
          id: `cfg-${row.block_id}-${row.successor_id}`,
          source: row.block_id,
          target: row.successor_id,
          kind: 'cfg',
          label: row.branch_label || ''
        },
        classes: 'cfg'
      })
    }
  }

  res.json({
    nodes: Array.from(nodeMap.values()),
    edges: edgeList,
    meta: {
      totalNodes: nodeMap.size,
      totalEdges: edgeList.length,
      isTruncated: false
    }
  })
})

router.get('/function-detail', (req, res) => {
  const db = getDb()
  const functionId = req.query.function as string

  if (!functionId) {
    res.status(400).json({ error: 'function parameter is required' })
    return
  }

  const row = db.prepare('SELECT * FROM dashboard_function_detail WHERE function_id = ?').get(functionId)
  if (!row) {
    res.status(404).json({ error: 'Function not found' })
    return
  }

  res.json({ data: row })
})

export { router as graphRouter }

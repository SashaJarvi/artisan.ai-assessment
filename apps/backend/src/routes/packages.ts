import { Router } from 'express';
import { getDb } from '../db.js';
import { cacheMiddleware } from '../middleware/cache.js';
import { getModuleColor, getModuleFromPackage } from '../lib/graph-transform.js';

const router = Router();

router.use(cacheMiddleware());

router.get('/modules', (_req, res) => {
  const db = getDb();
  const treemap = db.prepare('SELECT * FROM dashboard_package_treemap').all() as Array<{
    package: string;
    function_count: number;
    total_loc: number;
    total_complexity: number;
    avg_complexity: number;
    [key: string]: unknown;
  }>;
  const edges = db.prepare('SELECT source, target, weight FROM dashboard_package_graph').all() as Array<{
    source: string;
    target: string;
    weight: number;
  }>;

  // Aggregate packages by module
  const moduleStats = new Map<string, { packages: number; functions: number; loc: number; complexity: number }>();
  for (const t of treemap) {
    const mod = getModuleFromPackage(t.package);
    const stats = moduleStats.get(mod) ?? { packages: 0, functions: 0, loc: 0, complexity: 0 };
    stats.packages++;
    stats.functions += t.function_count;
    stats.loc += t.total_loc;
    stats.complexity += t.total_complexity;
    moduleStats.set(mod, stats);
  }

  const MODULE_LABELS: Record<string, string> = {
    prometheus: 'Prometheus',
    client_golang: 'client_golang',
    adapter: 'prometheus-adapter',
    alertmanager: 'Alertmanager',
    default: 'Other',
  };

  const nodes = Array.from(moduleStats.entries()).map(([mod, stats]) => ({
    data: {
      id: mod,
      label: MODULE_LABELS[mod] ?? mod,
      kind: 'module',
      module: mod,
      color: getModuleColor(mod === 'prometheus' ? 'github.com/prometheus/prometheus' : mod),
      size: Math.max(40, Math.min(120, Math.sqrt(stats.complexity) * 2)),
      packageCount: stats.packages,
      functionCount: stats.functions,
      totalLoc: stats.loc,
      totalComplexity: stats.complexity,
    },
    classes: `module-${mod}`,
  }));

  // Aggregate inter-module edges
  const edgeMap = new Map<string, number>();
  for (const e of edges) {
    const srcMod = getModuleFromPackage(e.source);
    const tgtMod = getModuleFromPackage(e.target);
    if (srcMod !== tgtMod) {
      const key = `${srcMod}->${tgtMod}`;
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + (e.weight || 1));
    }
  }

  const cyEdges = Array.from(edgeMap.entries()).map(([key, weight], i) => {
    const [source, target] = key.split('->');
    return {
      data: {
        id: `mod-e-${i}`,
        source,
        target,
        kind: 'dependency',
        weight,
        label: `${weight}`,
      },
    };
  });

  res.json({
    nodes,
    edges: cyEdges,
    meta: { totalNodes: nodes.length, totalEdges: cyEdges.length, isTruncated: false },
  });
});

router.get('/graph', (req, res) => {
  const db = getDb();
  const moduleFilter = req.query.module as string | undefined;
  const edges = db.prepare('SELECT source, target, weight FROM dashboard_package_graph').all() as Array<{
    source: string;
    target: string;
    weight: number;
  }>;
  const treemap = db.prepare('SELECT * FROM dashboard_package_treemap').all() as Array<{
    package: string;
    function_count: number;
    total_loc: number;
    total_complexity: number;
    avg_complexity: number;
    [key: string]: unknown;
  }>;

  const treemapMap = new Map(treemap.map((t) => [t.package, t]));
  const nodeIds = new Set<string>();

  // Filter edges by module if specified
  const filteredEdges = moduleFilter
    ? edges.filter((e) => getModuleFromPackage(e.source) === moduleFilter && getModuleFromPackage(e.target) === moduleFilter)
    : edges;

  for (const e of filteredEdges) {
    nodeIds.add(e.source);
    nodeIds.add(e.target);
  }

  // If module filter, also add packages from treemap that belong to the module but have no edges
  if (moduleFilter) {
    for (const t of treemap) {
      if (getModuleFromPackage(t.package) === moduleFilter) {
        nodeIds.add(t.package);
      }
    }
  }

  const nodes = Array.from(nodeIds).map((pkg) => {
    const info = treemapMap.get(pkg);
    const mod = getModuleFromPackage(pkg);
    const size = info ? Math.max(20, Math.min(80, Math.sqrt(info.total_complexity || 1) * 3)) : 20;
    return {
      data: {
        id: pkg,
        label: pkg.split('/').pop() || pkg,
        fullLabel: pkg,
        kind: 'package',
        package: pkg,
        module: mod,
        color: getModuleColor(pkg),
        size,
        functionCount: info?.function_count ?? 0,
        totalLoc: info?.total_loc ?? 0,
        totalComplexity: info?.total_complexity ?? 0,
        avgComplexity: info?.avg_complexity ?? 0,
      },
      classes: `module-${mod}`,
    };
  });

  const cyEdges = filteredEdges.map((e, i) => ({
    data: {
      id: `pkg-e-${i}`,
      source: e.source,
      target: e.target,
      kind: 'dependency',
      weight: e.weight,
    },
  }));

  res.json({
    nodes,
    edges: cyEdges,
    meta: {
      totalNodes: nodes.length,
      totalEdges: cyEdges.length,
      isTruncated: false,
    },
  });
});

router.get('/treemap', (_req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM dashboard_package_treemap ORDER BY total_complexity DESC').all();
  res.json({ data: rows });
});

router.get('/:name/functions', (req, res) => {
  const db = getDb();
  const packageName = req.params.name;
  const rows = db.prepare(
    'SELECT * FROM dashboard_function_detail WHERE package = ? ORDER BY complexity DESC',
  ).all(packageName) as Array<Record<string, unknown>>;

  const data = rows.map((r) => ({
    functionId: r.function_id,
    name: r.name,
    package: r.package,
    file: r.file,
    line: r.line,
    endLine: r.end_line,
    signature: r.signature,
    complexity: r.complexity,
    loc: r.loc,
    fanIn: r.fan_in,
    fanOut: r.fan_out,
    numParams: r.num_params,
    numLocals: r.num_locals,
    numCalls: r.num_calls,
    numBranches: r.num_branches,
    numReturns: r.num_returns,
    findingCount: r.finding_count,
    callers: r.callers,
    callees: r.callees,
  }));

  res.json({ data });
});

router.get('/:name/coupling', (req, res) => {
  const db = getDb();
  const packageName = req.params.name;
  const outgoing = db.prepare(
    'SELECT target_package, call_count FROM package_coupling WHERE source_package = ? ORDER BY call_count DESC',
  ).all(packageName);
  const incoming = db.prepare(
    'SELECT source_package, call_count FROM package_coupling WHERE target_package = ? ORDER BY call_count DESC',
  ).all(packageName);
  res.json({ data: { outgoing, incoming } });
});

export { router as packagesRouter };

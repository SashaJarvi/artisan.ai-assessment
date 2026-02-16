import type { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: unknown; timestamp: number }>();

export const cacheMiddleware = (ttlMs = 0) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && (ttlMs === 0 || Date.now() - cached.timestamp < ttlMs)) {
      res.json(cached.data);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      cache.set(key, { data: body, timestamp: Date.now() });
      return originalJson(body);
    };

    next();
  };
};

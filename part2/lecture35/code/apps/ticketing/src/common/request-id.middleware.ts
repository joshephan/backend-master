import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

// 요청마다 ID를 정해 요청 헤더와 응답 헤더에 싣는다. 앞단이 붙인 ID가 있으면 그대로 쓴다
export function requestId(req: Request, res: Response, next: NextFunction) {
  const id = req.header('x-request-id') ?? randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
}

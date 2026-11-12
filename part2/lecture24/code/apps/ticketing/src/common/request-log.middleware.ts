import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

// 응답이 끝난 뒤 요청 ID, 메서드, 경로, 상태 코드, 걸린 시간을 한 줄로 남긴다
export function requestLog(req: Request, res: Response, next: NextFunction) {
  const started = performance.now();
  res.on('finish', () => {
    const ms = (performance.now() - started).toFixed(1);
    logger.log(`${req.headers['x-request-id']} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
}

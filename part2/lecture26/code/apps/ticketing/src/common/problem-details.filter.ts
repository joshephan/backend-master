import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';
import { ProblemException } from './problem.exception.js';

// 모든 예외를 RFC 9457 Problem Details 모양으로 바꾼다
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemDetails');

  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();

    let status = 500;
    let body: Record<string, unknown>;

    if (exception instanceof ProblemException) {
      status = exception.getStatus();
      body = { type: exception.type, title: exception.title, status, detail: exception.message, ...exception.extensions };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse() as { message?: string | string[] } | string;
      const message = typeof r === 'string' ? r : r.message;
      body = { type: 'about:blank', title: STATUS_CODES[status], status };
      if (Array.isArray(message)) body.errors = message;
      else if (message) body.detail = message;
    } else {
      // 내부 사정(에러 메시지, 스택): 로그에만 기록, 응답에서 제외
      this.logger.error(exception);
      body = { type: 'about:blank', title: STATUS_CODES[500], status, detail: '요청을 처리하지 못했습니다.' };
    }

    body.instance = req.originalUrl;
    res.status(status).type('application/problem+json').json(body);
  }
}

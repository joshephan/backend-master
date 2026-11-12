import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { DomainError, type DomainErrorKind } from './domain-error.js';

const STATUS: Record<DomainErrorKind, number> = { 'not-found': 404, conflict: 409, rejected: 422 };

// 업무 예외를 Problem Details 응답으로 바꾼다
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('DomainError');
  private readonly rpcFilter = new BaseRpcExceptionFilter();

  catch(error: DomainError, host: ArgumentsHost) {
    if (host.getType() !== 'http') return this.rpcFilter.catch(error, host);
    const req = host.switchToHttp().getRequest<Request>();
    const res = host.switchToHttp().getResponse<Response>();
    const status = STATUS[error.kind];
    this.logger.warn(`${req.headers['x-request-id']} ${error.name}: ${error.message}`);
    res.status(status).type('application/problem+json').json({
      ...error.details, // 확장 필드가 표준 칸(type, status 등)을 덮지 못하게 먼저 펼친다
      type: `https://api.ticketing.example/problems/${error.code}`,
      title: error.name,
      status,
      detail: error.message,
      instance: req.originalUrl,
    });
  }
}

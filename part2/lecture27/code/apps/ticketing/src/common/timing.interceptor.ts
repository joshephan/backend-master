import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

// 핸들러마다 걸린 시간을 남긴다. 예외로 끝나도 남긴다
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = performance.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const name = `${context.getClass().name}.${context.getHandler().name}`;
    const done = (result: string) => {
      const ms = (performance.now() - started).toFixed(1);
      this.logger.log(`${req.headers['x-request-id']} ${name} ${result} ${ms}ms`);
    };
    return next.handle().pipe(
      tap({
        next: () => done(String(http.getResponse<Response>().statusCode)),
        error: (err) => done(`실패(${err.constructor.name})`),
      }),
    );
  }
}

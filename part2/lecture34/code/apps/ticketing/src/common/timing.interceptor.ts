import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

// 핸들러마다 걸린 시간을 남긴다. 예외로 끝나도 남긴다
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = performance.now();
    const name = `${context.getClass().name}.${context.getHandler().name}`;
    // HTTP 요청이면 요청 ID와 상태 코드, TCP 같은 다른 입구면 입구 종류(rpc)만 남긴다
    const isHttp = context.getType() === 'http';
    const http = context.switchToHttp();
    const tag = isHttp ? http.getRequest<Request>().headers['x-request-id'] : context.getType();
    const done = (result: string) => {
      const ms = (performance.now() - started).toFixed(1);
      this.logger.log(`${tag} ${name} ${result} ${ms}ms`);
    };
    return next.handle().pipe(
      tap({
        next: () => done(isHttp ? String(http.getResponse<Response>().statusCode) : 'ok'),
        error: (err) => done(`실패(${err.constructor.name})`),
      }),
    );
  }
}

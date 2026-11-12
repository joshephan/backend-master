import {
  ArgumentMetadata, CallHandler, CanActivate, ExecutionContext, Injectable,
  NestInterceptor, NestMiddleware, PipeTransform,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

export const log = (step: string) => console.log(step);

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    log(`1 미들웨어 ${req.method} ${req.originalUrl}`);
    next();
  }
}

@Injectable()
export class TraceGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    log(`2 가드 (params.id: ${typeof req.params.id} ${JSON.stringify(req.params.id)})`);
    return req.headers['x-block'] !== 'guard';
  }
}

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    log('3 인터셉터 (앞)');
    return next.handle().pipe(tap(() => log('6 인터셉터 (뒤)')));
  }
}

@Injectable()
export class TracePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    log(`4 파이프 (${metadata.type} ${metadata.data}=${value})`);
    return value;
  }
}

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ProblemDetailsFilter } from '../common/problem-details.filter.js';

@Catch()
export class TraceFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    log(`7 예외 필터 (${exception.constructor.name})`);
    new ProblemDetailsFilter().catch(exception, host);
  }
}

@Injectable()
export class MethodInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    log('3b 메서드 인터셉터 (앞)');
    return next.handle().pipe(tap(() => log('6a 메서드 인터셉터 (뒤)')));
  }
}

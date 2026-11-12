import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TraceController } from './trace.controller.js';
import { TraceMiddleware } from './trace.js';

@Module({ controllers: [TraceController] })
export class TraceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*path');
  }
}

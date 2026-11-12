import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';
import { requestId } from './common/request-id.middleware.js';
import { requestLog } from './common/request-log.middleware.js';

process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestId, requestLog); // body parser보다 먼저: 본문 때문에 거절된 요청도 남긴다
  app.use(compression());
  app.useGlobalFilters(new ProblemDetailsFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000; // 로드 밸런서 유휴 시간(60초)보다 길게
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

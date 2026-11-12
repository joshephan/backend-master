import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { AppModule } from './app.module.js';
import { ProblemDetailsFilter } from './common/problem-details.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.useGlobalFilters(new ProblemDetailsFilter());
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000; // 로드 밸런서 유휴 시간(60초)보다 길게
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

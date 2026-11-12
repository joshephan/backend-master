import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import { requestId } from './common/request-id.middleware.js';
import { requestLog } from './common/request-log.middleware.js';

process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestId, requestLog); // body parser보다 먼저: 본문 때문에 거절된 요청도 남긴다
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const server = app.getHttpServer();
  server.keepAliveTimeout = 65_000; // 로드 밸런서 유휴 시간(60초)보다 길게
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: Number(process.env.TCP_PORT ?? 4001) },
  }, { inheritAppConfig: true });
  app.enableShutdownHooks();
  await app.init();
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

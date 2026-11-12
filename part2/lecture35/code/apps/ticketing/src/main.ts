import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';

process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
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

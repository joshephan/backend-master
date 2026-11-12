import { type INestApplication, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { requestId } from './common/request-id.middleware.js';
import { requestLog } from './common/request-log.middleware.js';

// main.ts와 e2e 테스트가 같이 부르는 앱 설정
export function setupApp(app: INestApplication) {
  app.use(requestId, requestLog); // body parser보다 먼저: 본문 때문에 거절된 요청도 남긴다
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
}

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { PaymentGateway } from './../src/payments/payment-gateway.js';
import { FakePaymentGateway } from './../src/payments/fake-payment-gateway.js';
import { SmsOutbox } from './../src/notifications/sms-outbox.js';
import { setupApp } from './../src/setup-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PaymentGateway)
      .useClass(FakePaymentGateway)
      .overrideProvider(SmsOutbox)
      .useValue({ enqueue: () => {} })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('예매 API: A구역 3열 15번');
  });

  afterEach(async () => {
    await app.close();
  });
});

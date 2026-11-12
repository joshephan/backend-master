import { readFileSync } from 'node:fs';
import { vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PaymentGateway } from '../src/payments/payment-gateway.js';
import { FakePaymentGateway } from '../src/payments/fake-payment-gateway.js';
import { SmsOutbox } from '../src/notifications/sms-outbox.js';
import { setupApp } from '../src/setup-app.js';

describe('예매 흐름 (e2e)', () => {
  let container: StartedPostgreSqlContainer;
  let app: INestApplication;
  const outbox = { enqueue: vi.fn() };

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').withName('ch08-pg-35').start();
    const pool = new Pool({ connectionString: container.getConnectionUri() });
    await pool.query(readFileSync('db/schema.sql', 'utf8'));
    await pool.end();
    process.env.DATABASE_URL = container.getConnectionUri();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PaymentGateway)
      .useClass(FakePaymentGateway)
      .overrideProvider(SmsOutbox)
      .useValue(outbox)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('공연 등록부터 영수증까지', async () => {
    const http = () => request(app.getHttpServer());

    await http().post('/concerts').send({ title: '가을 콘서트', venue: '올림픽홀' }).expect(201);
    await http().post('/performances').send({ concertId: 1, startsAt: '2026-12-24T19:00' }).expect(201);
    await http().post('/performances/1/seats').expect(201);

    const held = await http().post('/performances/1/seats/A-3-15/hold').expect(201);
    expect(held.body).toEqual({ id: 'A-3-15', label: 'A구역 3열 15번', status: 'HELD' });
    await http().post('/performances/1/seats/A-3-15/hold').expect(409);

    const reserved = await http()
      .post('/reservations')
      .send({ seatId: 'A-3-15', amount: 110000, buyer: '김민수' })
      .expect(201);
    expect(reserved.body.approvalId).toBe('fake-110000');
    expect(reserved.body.message).toBe('[문자 → 김민수] A-3-15 예매가 확정되었습니다');
    expect(outbox.enqueue).toHaveBeenCalledWith('김민수', 'A-3-15 예매가 확정되었습니다');

    const receipt = await http().get(`/reservations/${reserved.body.id}/receipt`).expect(200);
    expect(receipt.text).toBe(`영수증 PDF: 예매 ${reserved.body.id}번`);
  });

  it('없는 회차에는 좌석을 열 수 없다', async () => {
    await request(app.getHttpServer()).post('/performances/99/seats').expect(404);
  });

  // 지금은 201: 예매가 좌석 상태를 확인하지 않는다(좌석 애그리거트에서 고친다)
  it.todo('붙잡지 않은 좌석으로 예매하면 409');
});

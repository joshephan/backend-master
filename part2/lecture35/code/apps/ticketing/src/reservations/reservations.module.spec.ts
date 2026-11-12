import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module.js';
import { ReservationsService } from './reservations.service.js';
import { PaymentGateway } from '../payments/payment-gateway.js';
import { FakePaymentGateway } from '../payments/fake-payment-gateway.js';
import { SmsOutbox } from '../notifications/sms-outbox.js';

describe('예매 모듈 조립', () => {
  let moduleRef: TestingModule;
  const outbox = { enqueue: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PaymentGateway)
      .useClass(FakePaymentGateway)
      .overrideProvider(SmsOutbox)
      .useValue(outbox)
      .compile();
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('결제사와 문자 발송함만 바꾸고 예매하면 확정 문자가 발송함에 들어간다', async () => {
    const result = await moduleRef.get(ReservationsService).reserve('A-3-15', 110000, '김민수');

    expect(result.approvalId).toBe('fake-110000');
    expect(result.message).toBe('[문자 → 김민수] A-3-15 예매가 확정되었습니다');
    expect(outbox.enqueue).toHaveBeenCalledWith('김민수', 'A-3-15 예매가 확정되었습니다');
  });

  it('환불 쪽 별칭도 같은 페이크를 받는다', () => {
    expect(moduleRef.get('LEGACY_PAYMENT')).toBeInstanceOf(FakePaymentGateway);
  });
});

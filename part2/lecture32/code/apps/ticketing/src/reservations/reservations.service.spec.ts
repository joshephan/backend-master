import { vi } from 'vitest';
import { ReservationsService } from './reservations.service.js';
import { PaymentGateway } from '../payments/payment-gateway.js';
import { TaggedLogger } from '../logging/tagged-logger.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { FakePaymentGateway } from '../payments/fake-payment-gateway.js';

describe('ReservationsService', () => {
  const gateway = { charge: vi.fn(), refund: vi.fn() };
  const logger = { setTag: () => {}, log: () => {} };
  const notifications = { sendConfirmed: vi.fn() };
  let service: ReservationsService;

  beforeEach(() => {
    vi.resetAllMocks();
    gateway.charge.mockResolvedValue({ approvalId: 'pg-110000', amount: 110000 });
    notifications.sendConfirmed.mockReturnValue('[문자 → 김민수] A-3-15 예매가 확정되었습니다');
    service = new ReservationsService(
      gateway as unknown as PaymentGateway,
      logger as unknown as TaggedLogger,
      notifications as unknown as NotificationsService,
    );
  });

  it('결제가 되면 확정 문자를 한 번 보낸다', async () => {
    const result = await service.reserve('A-3-15', 110000, '김민수');

    expect(result.approvalId).toBe('pg-110000');
    expect(notifications.sendConfirmed).toHaveBeenCalledTimes(1);
    expect(notifications.sendConfirmed).toHaveBeenCalledWith('sms', '김민수', 'A-3-15');
  });

  it('결제가 실패하면 확정 문자를 보내지 않는다', async () => {
    gateway.charge.mockRejectedValue(new Error('카드 한도 초과'));

    await expect(service.reserve('A-3-15', 110000, '김민수')).rejects.toThrow('카드 한도 초과');
    expect(notifications.sendConfirmed).not.toHaveBeenCalled();
  });
});

describe('ReservationsService와 페이크 결제사', () => {
  it('페이크 결제사로 예매하면 fake 승인 번호가 붙는다', async () => {
    const gateway = new FakePaymentGateway();
    const charge = vi.spyOn(gateway, 'charge');
    const service = new ReservationsService(
      gateway,
      { setTag: () => {}, log: () => {} } as unknown as TaggedLogger,
      { sendConfirmed: () => '' } as unknown as NotificationsService,
    );

    const result = await service.reserve('A-3-15', 110000, '김민수');

    expect(result.approvalId).toBe('fake-110000');
    expect(charge).toHaveBeenCalledWith(110000);
  });
});

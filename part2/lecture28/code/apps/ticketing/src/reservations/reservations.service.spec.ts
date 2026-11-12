import { ReservationsService } from './reservations.service.js';
import { PaymentGateway } from '../payments/payment-gateway.js';

it('결제사를 실제로 부르지 않고 예매를 시험한다', async () => {
  const fakeGateway = {
    charge: async (amount: number) => ({ approvalId: 'fake-1', amount }),
  } as PaymentGateway;

  const service = new ReservationsService(fakeGateway);

  expect(await service.reserve('A-3-15', 110000)).toEqual({
    seatId: 'A-3-15',
    approvalId: 'fake-1',
    amount: 110000,
  });
});

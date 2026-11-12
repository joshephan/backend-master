import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '../payments/payment-gateway.js';
import { TaggedLogger } from '../logging/tagged-logger.js';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly logger: TaggedLogger,
  ) {
    this.logger.setTag('예매');
  }

  async reserve(seatId: string, amount: number, buyer: string) {
    const payment = await this.gateway.charge(amount);
    this.logger.log(`${seatId} 결제 완료`);
    return { seatId, ...payment, notifyTo: buyer };
  }
}

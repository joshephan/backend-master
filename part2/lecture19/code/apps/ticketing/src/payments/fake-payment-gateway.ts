import { Injectable } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.js';

@Injectable()
export class FakePaymentGateway extends PaymentGateway {
  static created = 0;
  readonly no = ++FakePaymentGateway.created;

  constructor() {
    super();
    console.log(`FakePaymentGateway #${this.no} 생성`);
  }

  async charge(amount: number) {
    const delay = Number(process.env.FAKE_PG_DELAY_MS ?? 0);
    if (delay) await new Promise((r) => setTimeout(r, delay));
    return { approvalId: `fake-${amount}`, amount };
  }

  async refund(approvalId: string) {
    return { refunded: approvalId };
  }
}

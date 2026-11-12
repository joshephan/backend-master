import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentGateway {
  static created = 0;
  readonly no = ++PaymentGateway.created;

  constructor() {
    console.log(`PaymentGateway #${this.no} 생성`);
  }

  async charge(amount: number) {
    return { approvalId: `pay-${this.no}-${amount}`, amount };
  }

  async refund(approvalId: string) {
    return { refunded: approvalId };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { PaymentGateway } from '../payments/payment-gateway.js';

@Injectable()
export class RefundsService {
  constructor(@Inject('LEGACY_PAYMENT') private readonly gateway: PaymentGateway) {
    console.log('RefundsService 생성');
  }

  refund(approvalId: string) {
    return this.gateway.refund(approvalId);
  }
}

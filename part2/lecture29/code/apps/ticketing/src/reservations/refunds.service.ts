import { Inject, Injectable } from '@nestjs/common';
import { PaymentGateway } from '../payments/payment-gateway.js';
import { TaggedLogger } from '../logging/tagged-logger.js';

@Injectable()
export class RefundsService {
  constructor(
    @Inject('LEGACY_PAYMENT') private readonly gateway: PaymentGateway,
    private readonly logger: TaggedLogger,
  ) {
    this.logger.setTag('환불');
  }

  refund(approvalId: string) {
    this.logger.log(`${approvalId} 환불`);
    return this.gateway.refund(approvalId);
  }
}

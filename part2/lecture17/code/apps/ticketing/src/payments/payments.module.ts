import { Module } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.js';

@Module({
  providers: [PaymentGateway],
  exports: [PaymentGateway],
})
export class PaymentsModule {}

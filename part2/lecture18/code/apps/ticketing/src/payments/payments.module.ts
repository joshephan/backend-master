import { Module } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.js';
import { FakePaymentGateway } from './fake-payment-gateway.js';
import { HttpPaymentGateway } from './http-payment-gateway.js';
import { PAYMENT_OPTIONS, type PaymentOptions } from './payment-options.js';

@Module({
  providers: [
    {
      provide: PAYMENT_OPTIONS,
      useValue: { baseUrl: 'http://localhost:5018', timeoutMs: 3000 },
    },
    {
      provide: PaymentGateway,
      inject: [PAYMENT_OPTIONS],
      useFactory: async (options: PaymentOptions) => {
        if (process.env.PAYMENT_MODE === 'fake') return new FakePaymentGateway();
        const res = await fetch(`${options.baseUrl}/token`, {
          method: 'POST',
          signal: AbortSignal.timeout(options.timeoutMs),
        });
        const { accessToken } = await res.json();
        return new HttpPaymentGateway(options, accessToken);
      },
    },
    { provide: 'LEGACY_PAYMENT', useExisting: PaymentGateway },
  ],
  exports: [PaymentGateway, 'LEGACY_PAYMENT'],
})
export class PaymentsModule {}

import { DynamicModule, InjectionToken, Module, ModuleMetadata } from '@nestjs/common';
import { PaymentGateway } from './payment-gateway.js';
import { FakePaymentGateway } from './fake-payment-gateway.js';
import { HttpPaymentGateway } from './http-payment-gateway.js';
import { PAYMENT_OPTIONS, type PaymentOptions } from './payment-options.js';

const gatewayProvider = {
  provide: PaymentGateway,
  inject: [PAYMENT_OPTIONS],
  useFactory: async (options: PaymentOptions) => {
    console.log(`결제 설정: ${JSON.stringify(options)}`);
    if (options.mode === 'fake') return new FakePaymentGateway();
    const res = await fetch(`${options.baseUrl}/token`, {
      method: 'POST',
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    const { accessToken } = await res.json();
    return new HttpPaymentGateway(options, accessToken);
  },
};

@Module({})
export class PaymentsModule {
  static forRoot(options: PaymentOptions): DynamicModule {
    return {
      module: PaymentsModule,
      global: true,
      providers: [
        { provide: PAYMENT_OPTIONS, useValue: options },
        gatewayProvider,
        { provide: 'LEGACY_PAYMENT', useExisting: PaymentGateway },
      ],
      exports: [PaymentGateway, 'LEGACY_PAYMENT'],
    };
  }

  static forRootAsync(options: {
    imports?: ModuleMetadata['imports'];
    inject?: InjectionToken[];
    useFactory: (...args: any[]) => PaymentOptions | Promise<PaymentOptions>;
  }): DynamicModule {
    return {
      module: PaymentsModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: PAYMENT_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        gatewayProvider,
        { provide: 'LEGACY_PAYMENT', useExisting: PaymentGateway },
      ],
      exports: [PaymentGateway, 'LEGACY_PAYMENT'],
    };
  }
}

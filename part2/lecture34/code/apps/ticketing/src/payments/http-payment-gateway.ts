import { PaymentGateway } from './payment-gateway.js';
import type { PaymentOptions } from './payment-options.js';

export class HttpPaymentGateway extends PaymentGateway {
  constructor(
    private readonly options: PaymentOptions,
    private readonly accessToken: string,
  ) {
    super();
    console.log(`HttpPaymentGateway 생성: 토큰 ${accessToken}`);
  }

  async charge(amount: number) {
    const res = await fetch(`${this.options.baseUrl}/charge`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.accessToken}` },
      body: JSON.stringify({ amount }),
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });
    const { approvalId } = await res.json();
    return { approvalId, amount };
  }

  async refund(approvalId: string) {
    return { refunded: approvalId };
  }
}

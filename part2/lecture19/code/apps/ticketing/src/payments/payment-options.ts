export const PAYMENT_OPTIONS = Symbol('PAYMENT_OPTIONS');

export interface PaymentOptions {
  baseUrl: string;
  timeoutMs: number;
}

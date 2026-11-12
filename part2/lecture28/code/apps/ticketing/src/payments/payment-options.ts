export const PAYMENT_OPTIONS = Symbol('PAYMENT_OPTIONS');

export interface PaymentOptions {
  mode: 'fake' | 'http';
  baseUrl?: string;
  timeoutMs: number;
}

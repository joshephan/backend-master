export interface Payment {
  approvalId: string;
  amount: number;
}

export abstract class PaymentGateway {
  abstract charge(amount: number): Promise<Payment>;
  abstract refund(approvalId: string): Promise<{ refunded: string }>;
}

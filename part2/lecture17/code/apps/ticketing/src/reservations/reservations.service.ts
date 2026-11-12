import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '../payments/payment-gateway.js';

@Injectable()
export class ReservationsService {
  constructor(private readonly gateway: PaymentGateway) {
    console.log('ReservationsService 생성');
  }

  async reserve(seatId: string, amount: number) {
    const payment = await this.gateway.charge(amount);
    return { seatId, ...payment };
  }
}

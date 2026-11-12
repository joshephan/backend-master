import { Injectable } from '@nestjs/common';
import { PaymentGateway } from '../payments/payment-gateway.js';
import { TaggedLogger } from '../logging/tagged-logger.js';
import { NotificationsService } from '../notifications/notifications.service.js';

interface Reservation {
  id: number;
  seatId: string;
  buyer: string;
  approvalId: string;
  userAgent: string;
}

@Injectable()
export class ReservationsService {
  private readonly reservations = new Map<number, Reservation>();
  private nextId = 1;

  constructor(
    private readonly gateway: PaymentGateway,
    private readonly logger: TaggedLogger,
    private readonly notifications: NotificationsService,
  ) {
    this.logger.setTag('예매');
  }

  async reserve(seatId: string, amount: number, buyer: string, channel = 'sms', userAgent = 'unknown') {
    const payment = await this.gateway.charge(amount);
    const id = this.nextId++;
    this.reservations.set(id, { id, seatId, buyer, approvalId: payment.approvalId, userAgent });
    this.logger.log(`${seatId} 결제 완료 (${userAgent})`);
    const message = this.notifications.sendConfirmed(channel, buyer, seatId);
    return { id, seatId, ...payment, message };
  }

  findOne(id: number) {
    return this.reservations.get(id);
  }
}

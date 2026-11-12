import { Body, Controller, Post } from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';
import { RefundsService } from './refunds.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly refunds: RefundsService,
  ) {}

  @Post()
  reserve(@Body() body: { seatId: string; amount: number }) {
    return this.reservations.reserve(body.seatId, body.amount);
  }

  @Post('refund')
  refund(@Body() body: { approvalId: string }) {
    return this.refunds.refund(body.approvalId);
  }
}

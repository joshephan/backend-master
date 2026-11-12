import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module.js';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { RefundsService } from './refunds.service.js';

@Module({
  imports: [PaymentsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, RefundsService],
})
export class ReservationsModule {}

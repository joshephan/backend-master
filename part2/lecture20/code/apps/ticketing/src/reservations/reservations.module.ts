import { Module } from '@nestjs/common';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { RefundsService } from './refunds.service.js';
import { TaggedLogger } from '../logging/tagged-logger.js';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, RefundsService, TaggedLogger],
})
export class ReservationsModule {}

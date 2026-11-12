import { Module } from '@nestjs/common';
import { PerformancesModule } from '../performances/performances.module.js';
import { SeatsService } from './seats.service.js';
import { SeatsController } from './seats.controller.js';
import { BoxOfficeController } from './box-office.controller.js';

@Module({
  imports: [PerformancesModule],
  controllers: [SeatsController, BoxOfficeController],
  providers: [SeatsService],
})
export class SeatsModule {}

import { Module } from '@nestjs/common';
import { ConcertsModule } from '../concerts/concerts.module.js';
import { PerformancesService } from './performances.service.js';
import { PerformancesController } from './performances.controller.js';

@Module({
  imports: [ConcertsModule],
  controllers: [PerformancesController],
  providers: [PerformancesService],
})
export class PerformancesModule {}

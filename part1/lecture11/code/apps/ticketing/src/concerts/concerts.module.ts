import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service.js';
import { ConcertsController } from './concerts.controller.js';
import { HoldsController } from './holds.controller.js';

@Module({
  controllers: [ConcertsController, HoldsController],
  providers: [ConcertsService],
})
export class ConcertsModule {}

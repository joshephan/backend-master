import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service.js';
import { ConcertsController } from './concerts.controller.js';

@Module({
  controllers: [ConcertsController],
  providers: [ConcertsService],
})
export class ConcertsModule {}

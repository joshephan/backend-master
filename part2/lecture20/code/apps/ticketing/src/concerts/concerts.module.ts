import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service.js';
import { ConcertsController } from './concerts.controller.js';
import { FilesController } from '../files/files.controller.js';

@Module({
  controllers: [ConcertsController, FilesController],
  providers: [ConcertsService],
  exports: [ConcertsService],
})
export class ConcertsModule {}

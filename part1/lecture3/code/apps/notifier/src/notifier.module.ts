import { Module } from '@nestjs/common';
import { NotifierController } from './notifier.controller.js';
import { NotifierService } from './notifier.service.js';

@Module({
  imports: [],
  controllers: [NotifierController],
  providers: [NotifierService],
})
export class NotifierModule {}

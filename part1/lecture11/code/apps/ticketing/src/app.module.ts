import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConcertsModule } from './concerts/concerts.module.js';

@Module({
  imports: [ConcertsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

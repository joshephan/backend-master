import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConcertsModule } from './concerts/concerts.module.js';
import { PerformancesModule } from './performances/performances.module.js';
import { SeatsModule } from './seats/seats.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';

@Module({
  imports: [ConcertsModule, PerformancesModule, SeatsModule, ReservationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

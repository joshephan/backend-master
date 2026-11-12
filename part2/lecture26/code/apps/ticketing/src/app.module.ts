import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TimingInterceptor } from './common/timing.interceptor.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConcertsModule } from './concerts/concerts.module.js';
import { PerformancesModule } from './performances/performances.module.js';
import { SeatsModule } from './seats/seats.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    PaymentsModule.forRootAsync({
      useFactory: () => ({
        mode: process.env.PAYMENT_MODE === 'fake' ? 'fake' : 'http',
        baseUrl: process.env.PG_URL,
        timeoutMs: Number(process.env.PG_TIMEOUT_MS ?? 3000),
      }),
    }),
    ConcertsModule,
    PerformancesModule,
    SeatsModule,
    ReservationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: TimingInterceptor }],
})
export class AppModule {}

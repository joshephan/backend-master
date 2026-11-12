import { Module } from '@nestjs/common';
import { Pool } from 'pg';
import { PerformancesModule } from '../performances/performances.module.js';
import { SeatsService } from './seats.service.js';
import { SeatsController } from './seats.controller.js';
import { BoxOfficeController } from './box-office.controller.js';
import { SeatsRepository } from './seats.repository.js';
import { InMemorySeatsRepository } from './in-memory-seats.repository.js';
import { PgSeatsRepository } from './pg-seats.repository.js';

@Module({
  imports: [PerformancesModule],
  controllers: [SeatsController, BoxOfficeController],
  providers: [
    SeatsService,
    {
      provide: SeatsRepository,
      useFactory: () =>
        process.env.DATABASE_URL
          ? new PgSeatsRepository(new Pool({ connectionString: process.env.DATABASE_URL }))
          : new InMemorySeatsRepository(),
    },
  ],
})
export class SeatsModule {}

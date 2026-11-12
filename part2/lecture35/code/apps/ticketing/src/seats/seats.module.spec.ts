import { Test, TestingModule } from '@nestjs/testing';
import { SeatsModule } from './seats.module.js';
import { SeatsService } from './seats.service.js';
import { PerformancesService } from '../performances/performances.service.js';

describe('SeatsModule', () => {
  let moduleRef: TestingModule;
  let seats: SeatsService;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({ imports: [SeatsModule] })
      .overrideProvider(PerformancesService)
      .useValue({ findOne: (id: number) => ({ id, concertId: 1, startsAt: '2026-12-24T19:00' }) })
      .compile();
    seats = moduleRef.get(SeatsService);
    await seats.open(1);
  });

  it('온라인에서 A-3-15를 붙잡는다', async () => {
    expect((await seats.hold(1, 'A-3-15')).status).toBe('HELD');
  });

  it('현장 창구에서 A-3-15를 판다', async () => {
    expect((await seats.sell(1, 'A-3-15')).status).toBe('SOLD');
  });
});

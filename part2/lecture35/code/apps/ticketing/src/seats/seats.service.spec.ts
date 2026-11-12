import { NotFoundException } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { InMemorySeatsRepository } from './in-memory-seats.repository.js';
import { SeatUnavailableError } from './seat-errors.js';
import { PerformancesService } from '../performances/performances.service.js';

describe('SeatsService', () => {
  let service: SeatsService;

  beforeEach(async () => {
    const performances = {
      findOne: (id: number) => ({ id, concertId: 1, startsAt: '2026-12-24T19:00' }),
    } as unknown as PerformancesService;
    service = new SeatsService(performances, new InMemorySeatsRepository());
    await service.open(1);
  });

  it('빈 좌석을 붙잡으면 HELD가 된다', async () => {
    const seat = await service.hold(1, 'A-3-15');

    expect(seat.status).toBe('HELD');
  });

  it('이미 붙잡힌 좌석을 또 붙잡으면 409', async () => {
    await service.hold(1, 'A-3-15');

    await expect(service.hold(1, 'A-3-15')).rejects.toThrow(SeatUnavailableError);
  });

  it('없는 회차에는 좌석을 열 수 없다', async () => {
    const performances = {
      findOne: (id: number) => {
        throw new NotFoundException(`회차 ${id}번이 없습니다`);
      },
    } as unknown as PerformancesService;
    const service = new SeatsService(performances, new InMemorySeatsRepository());

    await expect(service.open(9)).rejects.toThrow('회차 9번이 없습니다');
  });

  it('남은 좌석이 없으면 매진', async () => {
    for (let row = 1; row <= 3; row++) {
      for (let no = 1; no <= 20; no++) await service.sell(1, `A-${row}-${no}`);
    }

    expect(await service.summary(1)).toEqual({ performanceId: 1, available: 0, soldOut: true });
  });

  it('같은 회차 좌석을 두 번 열면 409', async () => {
    await expect(service.open(1)).rejects.toThrow('회차 1번 좌석은 이미 열려 있습니다');
  });
});

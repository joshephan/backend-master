import { NotFoundException } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { SeatUnavailableError } from './seat-errors.js';
import { PerformancesService } from '../performances/performances.service.js';

describe('SeatsService', () => {
  let service: SeatsService;

  beforeEach(() => {
    const performances = {
      findOne: (id: number) => ({ id, concertId: 1, startsAt: '2026-12-24T19:00' }),
    } as unknown as PerformancesService;
    service = new SeatsService(performances);
    service.open(1);
  });

  it('빈 좌석을 붙잡으면 HELD가 된다', () => {
    const seat = service.hold(1, 'A-3-15');

    expect(seat.status).toBe('HELD');
  });

  it('이미 붙잡힌 좌석을 또 붙잡으면 409', () => {
    service.hold(1, 'A-3-15');

    expect(() => service.hold(1, 'A-3-15')).toThrow(SeatUnavailableError);
  });

  it('없는 회차에는 좌석을 열 수 없다', () => {
    const performances = {
      findOne: (id: number) => {
        throw new NotFoundException(`회차 ${id}번이 없습니다`);
      },
    } as unknown as PerformancesService;
    const service = new SeatsService(performances);

    expect(() => service.open(9)).toThrow('회차 9번이 없습니다');
  });
});

import { Injectable } from '@nestjs/common';
import { seatLabel } from '@app/common';
import { PerformancesService } from '../performances/performances.service.js';
import { Seat } from './entities/seat.entity.js';
import { SeatNotFoundError, SeatUnavailableError } from './seat-errors.js';

@Injectable()
export class SeatsService {
  private readonly seats = new Map<number, Seat[]>();

  constructor(private readonly performancesService: PerformancesService) {
    console.log('SeatsService 생성');
  }

  open(performanceId: number) {
    this.performancesService.findOne(performanceId);
    const seats: Seat[] = [];
    for (let row = 1; row <= 3; row++) {
      for (let no = 1; no <= 20; no++) {
        seats.push({ id: `A-${row}-${no}`, performanceId, zone: 'A', row, no, status: 'AVAILABLE' });
      }
    }
    this.seats.set(performanceId, seats);
    return { performanceId, count: seats.length };
  }

  findAll(performanceId: number) {
    return this.seats.get(performanceId) ?? [];
  }

  hold(performanceId: number, seatId: string) {
    const seat = this.takeAvailable(performanceId, seatId);
    seat.status = 'HELD';
    return seat;
  }

  sell(performanceId: number, seatId: string) {
    const seat = this.takeAvailable(performanceId, seatId);
    seat.status = 'SOLD';
    return seat;
  }

  private takeAvailable(performanceId: number, seatId: string) {
    const seat = this.findAll(performanceId).find((s) => s.id === seatId);
    if (!seat) {
      throw new SeatNotFoundError(`좌석 ${seatId}이 없습니다`, { seatId });
    }
    if (seat.status !== 'AVAILABLE') {
      throw new SeatUnavailableError(`${seatLabel(seat.zone, seat.row, seat.no)}은 이미 팔렸거나 선택된 좌석입니다`, {
        seatId,
        seatStatus: seat.status,
      });
    }
    return seat;
  }
}

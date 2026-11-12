import { Injectable } from '@nestjs/common';
import { seatLabel } from '@app/common';
import { PerformancesService } from '../performances/performances.service.js';
import { Seat, SeatStatus } from './entities/seat.entity.js';
import { SeatsRepository } from './seats.repository.js';
import { SeatNotFoundError, SeatNotSoldError, SeatsAlreadyOpenError, SeatUnavailableError } from './seat-errors.js';

@Injectable()
export class SeatsService {
  constructor(
    private readonly performancesService: PerformancesService,
    private readonly seatsRepository: SeatsRepository,
  ) {
    console.log('SeatsService 생성');
  }

  async open(performanceId: number) {
    this.performancesService.findOne(performanceId);
    if ((await this.seatsRepository.findAll(performanceId)).length > 0) {
      throw new SeatsAlreadyOpenError(`회차 ${performanceId}번 좌석은 이미 열려 있습니다`, { performanceId });
    }
    const seats: Seat[] = [];
    for (let row = 1; row <= 3; row++) {
      for (let no = 1; no <= 20; no++) {
        seats.push({ id: `A-${row}-${no}`, performanceId, zone: 'A', row, no, status: 'AVAILABLE' });
      }
    }
    await this.seatsRepository.insertMany(seats);
    return { performanceId, count: seats.length };
  }

  findAll(performanceId: number) {
    return this.seatsRepository.findAll(performanceId);
  }

  async summary(performanceId: number) {
    const available = await this.seatsRepository.countAvailable(performanceId);
    return { performanceId, available, soldOut: available === 0 };
  }

  hold(performanceId: number, seatId: string) {
    return this.take(performanceId, seatId, 'HELD');
  }

  sell(performanceId: number, seatId: string) {
    return this.take(performanceId, seatId, 'SOLD');
  }

  async release(performanceId: number, seatId: string) {
    const changed = await this.seatsRepository.changeIfSold(performanceId, seatId, 'AVAILABLE');
    const seat = await this.seatsRepository.findOne(performanceId, seatId);
    if (!seat) throw new SeatNotFoundError(`좌석 ${seatId}이 없습니다`, { seatId });
    if (!changed) {
      throw new SeatNotSoldError(`${seatLabel(seat.zone, seat.row, seat.no)}은 판매된 좌석이 아닙니다`, { seatId });
    }
    return seat;
  }

  private async take(performanceId: number, seatId: string, status: SeatStatus) {
    const changed = await this.seatsRepository.changeIfAvailable(performanceId, seatId, status);
    const seat = await this.seatsRepository.findOne(performanceId, seatId);
    if (!seat) {
      throw new SeatNotFoundError(`좌석 ${seatId}이 없습니다`, { seatId });
    }
    if (!changed) {
      throw new SeatUnavailableError(`${seatLabel(seat.zone, seat.row, seat.no)}은 이미 팔렸거나 선택된 좌석입니다`, {
        seatId,
        seatStatus: seat.status,
      });
    }
    return seat;
  }
}

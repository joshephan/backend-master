import { Seat, SeatStatus } from './entities/seat.entity.js';
import { SeatsRepository } from './seats.repository.js';

export class InMemorySeatsRepository extends SeatsRepository {
  private readonly seats = new Map<number, Seat[]>();

  async insertMany(seats: Seat[]) {
    for (const seat of seats) {
      const list = this.seats.get(seat.performanceId) ?? [];
      list.push({ ...seat });
      this.seats.set(seat.performanceId, list);
    }
  }

  async findAll(performanceId: number) {
    return this.seats.get(performanceId) ?? [];
  }

  async findOne(performanceId: number, seatId: string) {
    return (await this.findAll(performanceId)).find((s) => s.id === seatId);
  }

  async changeIfAvailable(performanceId: number, seatId: string, status: SeatStatus) {
    const seat = await this.findOne(performanceId, seatId);
    if (!seat || seat.status !== 'AVAILABLE') return false;
    seat.status = status;
    return true;
  }

  async changeIfSold(performanceId: number, seatId: string, status: SeatStatus) {
    const seat = await this.findOne(performanceId, seatId);
    if (!seat || seat.status !== 'SOLD') return false;
    seat.status = status;
    return true;
  }

  async countAvailable(performanceId: number) {
    return (await this.findAll(performanceId)).filter((s) => s.status === 'AVAILABLE').length;
  }
}

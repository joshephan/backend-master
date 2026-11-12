import { Seat, SeatStatus } from './entities/seat.entity.js';

export abstract class SeatsRepository {
  abstract insertMany(seats: Seat[]): Promise<void>;
  abstract findAll(performanceId: number): Promise<Seat[]>;
  abstract findOne(performanceId: number, seatId: string): Promise<Seat | undefined>;
  abstract changeIfAvailable(performanceId: number, seatId: string, status: SeatStatus): Promise<boolean>;
  abstract changeIfSold(performanceId: number, seatId: string, status: SeatStatus): Promise<boolean>;
  abstract countAvailable(performanceId: number): Promise<number>;
}

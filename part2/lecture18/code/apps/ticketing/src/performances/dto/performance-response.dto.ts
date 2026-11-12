import { Performance } from '../entities/performance.entity.js';

export class PerformanceResponseDto {
  id: number;
  concertId: number;
  startsAt: string;

  static from(performance: Performance): PerformanceResponseDto {
    return { id: performance.id, concertId: performance.concertId, startsAt: performance.startsAt };
  }
}

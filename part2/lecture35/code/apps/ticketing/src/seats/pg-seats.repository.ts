import { OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { Seat, SeatStatus } from './entities/seat.entity.js';
import { SeatsRepository } from './seats.repository.js';

const columns = `performance_id AS "performanceId", id, zone, row_no AS "row", seat_no AS "no", status`;

export class PgSeatsRepository extends SeatsRepository implements OnModuleDestroy {
  constructor(private readonly pool: Pool) {
    super();
  }

  async insertMany(seats: Seat[]) {
    for (const s of seats) {
      await this.pool.query(
        'INSERT INTO seats (performance_id, id, zone, row_no, seat_no, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [s.performanceId, s.id, s.zone, s.row, s.no, s.status],
      );
    }
  }

  async findAll(performanceId: number) {
    const { rows } = await this.pool.query<Seat>(
      `SELECT ${columns} FROM seats WHERE performance_id = $1 ORDER BY row_no, seat_no`,
      [performanceId],
    );
    return rows;
  }

  async findOne(performanceId: number, seatId: string) {
    const { rows } = await this.pool.query<Seat>(
      `SELECT ${columns} FROM seats WHERE performance_id = $1 AND id = $2`,
      [performanceId, seatId],
    );
    return rows[0];
  }

  async changeIfAvailable(performanceId: number, seatId: string, status: SeatStatus) {
    const { rowCount } = await this.pool.query(
      `UPDATE seats SET status = $3 WHERE performance_id = $1 AND id = $2 AND status = 'AVAILABLE'`,
      [performanceId, seatId, status],
    );
    return rowCount === 1;
  }

  async changeIfSold(performanceId: number, seatId: string, status: SeatStatus) {
    const { rowCount } = await this.pool.query(
      `UPDATE seats SET status = $3 WHERE performance_id = $1 AND id = $2 AND status = 'SOLD'`,
      [performanceId, seatId, status],
    );
    return rowCount === 1;
  }

  async countAvailable(performanceId: number) {
    const { rows } = await this.pool.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM seats WHERE performance_id = $1 AND status = 'AVAILABLE'`,
      [performanceId],
    );
    return rows[0].count;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}

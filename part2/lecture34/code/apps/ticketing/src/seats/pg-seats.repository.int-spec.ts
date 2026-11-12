import { readFileSync } from 'node:fs';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { SeatsService } from './seats.service.js';
import { PgSeatsRepository } from './pg-seats.repository.js';
import { PerformancesService } from '../performances/performances.service.js';

describe('SeatsService + PostgreSQL', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let service: SeatsService;

  beforeAll(async () => {
    const started = Date.now();
    container = await new PostgreSqlContainer('postgres:17-alpine').withName('ch08-pg-34').start();
    console.log(`컨테이너 준비: ${Date.now() - started}ms, ${container.getConnectionUri()}`);
    pool = new Pool({ connectionString: container.getConnectionUri() });
    await pool.query(readFileSync('db/schema.sql', 'utf8'));
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE seats');
    const performances = {
      findOne: (id: number) => ({ id, concertId: 1, startsAt: '2026-12-24T19:00' }),
    } as unknown as PerformancesService;
    service = new SeatsService(performances, new PgSeatsRepository(pool));
    await service.open(1);
  });

  it('빈 좌석을 붙잡으면 HELD가 된다', async () => {
    const seat = await service.hold(1, 'A-3-15');

    expect(seat).toMatchObject({ id: 'A-3-15', row: 3, no: 15, status: 'HELD' });
  });

  it('이미 붙잡힌 좌석을 또 붙잡으면 409', async () => {
    await service.hold(1, 'A-3-15');

    await expect(service.hold(1, 'A-3-15')).rejects.toThrow('A구역 3열 15번은 이미 팔렸거나 선택된 좌석입니다');
  });

  it('남은 좌석이 없으면 매진', async () => {
    await pool.query(`UPDATE seats SET status = 'SOLD' WHERE performance_id = 1`);

    expect(await service.summary(1)).toEqual({ performanceId: 1, available: 0, soldOut: true });
  });

  it('같은 회차 좌석을 두 번 열면 409', async () => {
    await expect(service.open(1)).rejects.toThrow('회차 1번 좌석은 이미 열려 있습니다');
  });
});

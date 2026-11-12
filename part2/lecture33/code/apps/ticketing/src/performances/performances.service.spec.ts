import { vi } from 'vitest';
import { PerformancesService } from './performances.service.js';
import { ConcertsService } from '../concerts/concerts.service.js';

describe('PerformancesService', () => {
  let service: PerformancesService;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));
    const concerts = { findOne: (id: number) => ({ id }) } as unknown as ConcertsService;
    service = new PerformancesService(concerts);
    service.create({ concertId: 1, startsAt: '2026-10-01T19:00' });
    service.create({ concertId: 1, startsAt: '2026-12-24T19:00' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('지금보다 뒤에 시작하는 회차만 나온다', () => {
    expect(service.findUpcoming().map((p) => p.startsAt)).toEqual(['2026-12-24T19:00']);
  });

  it('시작 시각이 지난 회차는 빠진다', () => {
    vi.setSystemTime(new Date('2026-12-25T00:00:00Z'));

    expect(service.findUpcoming()).toEqual([]);
  });
});

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConcertsService } from '../concerts/concerts.service.js';
import { CreatePerformanceDto } from './dto/create-performance.dto.js';
import { UpdatePerformanceDto } from './dto/update-performance.dto.js';
import { Performance } from './entities/performance.entity.js';

@Injectable()
export class PerformancesService {
  private readonly performances: Performance[] = [];
  private nextId = 1;

  constructor(private readonly concertsService: ConcertsService) {}

  create(createPerformanceDto: CreatePerformanceDto) {
    const { concertId, startsAt } = createPerformanceDto;
    this.concertsService.findOne(concertId);
    const performance = { id: this.nextId++, concertId, startsAt };
    this.performances.push(performance);
    return performance;
  }

  findAll(concertId?: number) {
    if (concertId === undefined) return this.performances;
    return this.performances.filter((p) => p.concertId === concertId);
  }

  findUpcoming() {
    const now = new Date().toISOString();
    return this.performances.filter((p) => p.startsAt > now);
  }

  findOne(id: number) {
    const performance = this.performances.find((p) => p.id === id);
    if (!performance) {
      throw new NotFoundException(`회차 ${id}번이 없습니다`);
    }
    return performance;
  }

  toIcs(id: number) {
    const { startsAt } = this.findOne(id);
    return `BEGIN:VEVENT
DTSTART:${startsAt.replace(/[-:]/g, '')}00
END:VEVENT`;
  }

  update(id: number, updatePerformanceDto: UpdatePerformanceDto) {
    return `This action updates a #${id} performance`;
  }

  remove(id: number) {
    this.findOne(id);
    const index = this.performances.findIndex((p) => p.id === id);
    this.performances.splice(index, 1);
  }
}

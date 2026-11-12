import { Injectable } from '@nestjs/common';
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
    this.concertsService.findOne(concertId); // 없으면 NotFoundException
    const performance = { id: this.nextId++, concertId, startsAt };
    this.performances.push(performance);
    return performance;
  }

  findAll() {
    return this.performances;
  }

  findOne(id: number) {
    return this.performances.find((performance) => performance.id === id);
  }

  update(id: number, updatePerformanceDto: UpdatePerformanceDto) {
    return `This action updates a #${id} performance`;
  }

  remove(id: number) {
    return `This action removes a #${id} performance`;
  }
}

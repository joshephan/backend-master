import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateConcertDto } from './dto/create-concert.dto.js';
import { UpdateConcertDto } from './dto/update-concert.dto.js';

interface Hold {
  holdId: number;
  performanceId: number;
  seat: string;
}

@Injectable()
export class ConcertsService {
  private readonly concerts = [{ id: 1, title: '10월 콘서트' }];
  private readonly holds = new Map<string, Hold>();
  private nextHoldId = 1;

  create(createConcertDto: CreateConcertDto) {
    return 'This action adds a new concert';
  }

  findAll() {
    return this.concerts;
  }

  findOne(id: number) {
    const concert = this.concerts.find((c) => c.id === id);
    if (!concert) {
      throw new NotFoundException(`공연 ${id}번이 없습니다`);
    }
    return concert;
  }

  update(id: number, updateConcertDto: UpdateConcertDto) {
    return `This action updates a #${id} concert`;
  }

  remove(id: number) {
    return `This action removes a #${id} concert`;
  }

  hold(performanceId: number, seat: string) {
    const key = `${performanceId}:${seat}`;
    if (this.holds.has(key)) {
      throw new ConflictException(`Seat ${seat} is already held`);
    }
    const hold = { holdId: this.nextHoldId++, performanceId, seat };
    this.holds.set(key, hold);
    return hold;
  }

  release(performanceId: number, holdId: number) {
    for (const [key, hold] of this.holds) {
      if (hold.performanceId === performanceId && hold.holdId === holdId) {
        this.holds.delete(key);
      }
    }
  }
}

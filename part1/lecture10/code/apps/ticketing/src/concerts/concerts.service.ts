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
  private readonly seatMap = buildSeatMap();

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

  seats(performanceId: number) {
    return this.seatMap;
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

// 20개 구역 x 50열 x 50석 = 50,000석. 판매 여부는 고정 시드로 채운다
function buildSeatMap() {
  const zones = 'ABCDEFGHIJKLMNOPQRST'.split('');
  const seats: { id: string; zone: string; row: number; no: number; status: string }[] = [];
  let x = 1;
  for (const zone of zones)
    for (let row = 1; row <= 50; row++)
      for (let no = 1; no <= 50; no++) {
        x = (x * 48271) % 2147483647;
        seats.push({ id: `${zone}-${row}-${no}`, zone, row, no, status: x % 10 < 3 ? 'sold' : 'available' });
      }
  return seats;
}

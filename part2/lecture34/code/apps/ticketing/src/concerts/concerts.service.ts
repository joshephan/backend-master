import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConcertDto } from './dto/create-concert.dto.js';
import { UpdateConcertDto } from './dto/update-concert.dto.js';
import { Concert } from './entities/concert.entity.js';

@Injectable()
export class ConcertsService {
  private readonly concerts: Concert[] = [];
  private nextId = 1;

  constructor() {
    console.log('ConcertsService 생성');
  }

  create(createConcertDto: CreateConcertDto) {
    const concert: Concert = {
      id: this.nextId++,
      title: createConcertDto.title,
      venue: createConcertDto.venue,
      settlementRate: 0.1,
      createdAt: new Date(),
    };
    this.concerts.push(concert);
    return concert;
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
    const concert = this.findOne(id);
    if (updateConcertDto.title !== undefined) concert.title = updateConcertDto.title;
    if (updateConcertDto.venue !== undefined) concert.venue = updateConcertDto.venue;
    return concert;
  }

  remove(id: number) {
    this.findOne(id);
    this.concerts.splice(this.concerts.findIndex((c) => c.id === id), 1);
  }
}

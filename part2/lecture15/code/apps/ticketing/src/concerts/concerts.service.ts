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
    const concert = { id: this.nextId++, title: createConcertDto.title };
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
    return `This action updates a #${id} concert`;
  }

  remove(id: number) {
    return `This action removes a #${id} concert`;
  }
}

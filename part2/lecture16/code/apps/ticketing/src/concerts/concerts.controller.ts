import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post,
} from '@nestjs/common';
import { ConcertsService } from './concerts.service.js';
import { CreateConcertDto } from './dto/create-concert.dto.js';
import { UpdateConcertDto } from './dto/update-concert.dto.js';
import { ConcertResponseDto } from './dto/concert-response.dto.js';

@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Post()
  create(@Body() createConcertDto: CreateConcertDto) {
    return ConcertResponseDto.from(this.concertsService.create(createConcertDto));
  }

  @Get()
  findAll() {
    return this.concertsService.findAll().map(ConcertResponseDto.from);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return ConcertResponseDto.from(this.concertsService.findOne(id));
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateConcertDto: UpdateConcertDto) {
    return ConcertResponseDto.from(this.concertsService.update(id, updateConcertDto));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.concertsService.remove(id);
  }
}

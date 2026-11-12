import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ListSeatsQuery } from './dto/list-seats.query.js';
import { SeatsService } from './seats.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
import { SeatIdPipe } from '../common/seat-id.pipe.js';

@Controller('performances/:performanceId/seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  open(@Param('performanceId', ParseIntPipe) performanceId: number) {
    return this.seatsService.open(performanceId);
  }

  @Get()
  async findAll(@Param('performanceId', ParseIntPipe) performanceId: number, @Query() query: ListSeatsQuery) {
    return (await this.seatsService.findAll(performanceId)).filter(
      (s) => (query.row === undefined || s.row === query.row) && (query.status === undefined || s.status === query.status),
    ).map(SeatResponseDto.from);
  }

  @Get('summary')
  summary(@Param('performanceId', ParseIntPipe) performanceId: number) {
    return this.seatsService.summary(performanceId);
  }

  @Post(':seatId/hold')
  async hold(@Param('performanceId', ParseIntPipe) performanceId: number, @Param('seatId', SeatIdPipe) seatId: string) {
    return SeatResponseDto.from(await this.seatsService.hold(performanceId, seatId));
  }
}

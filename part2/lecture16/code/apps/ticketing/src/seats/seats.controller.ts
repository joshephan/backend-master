import { Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';

@Controller('performances/:performanceId/seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post()
  open(@Param('performanceId', ParseIntPipe) performanceId: number) {
    return this.seatsService.open(performanceId);
  }

  @Get()
  findAll(@Param('performanceId', ParseIntPipe) performanceId: number) {
    return this.seatsService.findAll(performanceId).map(SeatResponseDto.from);
  }

  @Post(':seatId/hold')
  hold(@Param('performanceId', ParseIntPipe) performanceId: number, @Param('seatId') seatId: string) {
    return SeatResponseDto.from(this.seatsService.hold(performanceId, seatId));
  }
}

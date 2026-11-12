import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SeatsService } from './seats.service.js';

@Controller('box-office/performances/:performanceId/seats')
export class BoxOfficeController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post(':seatId/sell')
  sell(@Param('performanceId', ParseIntPipe) performanceId: number, @Param('seatId') seatId: string) {
    return this.seatsService.sell(performanceId, seatId);
  }
}

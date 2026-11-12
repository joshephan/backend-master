import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';

@Controller('box-office/performances/:performanceId/seats')
export class BoxOfficeController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post(':seatId/sell')
  sell(@Param('performanceId', ParseIntPipe) performanceId: number, @Param('seatId') seatId: string) {
    return SeatResponseDto.from(this.seatsService.sell(performanceId, seatId));
  }
}

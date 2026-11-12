import { Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { Staff } from '../staff/staff.service.js';
import { StaffKeyGuard } from '../common/staff-key.guard.js';
import { SeatsService } from './seats.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
import { SeatIdPipe } from '../common/seat-id.pipe.js';

@Controller('box-office/performances/:performanceId/seats')
@UseGuards(StaffKeyGuard)
export class BoxOfficeController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post(':seatId/sell')
  sell(
    @Param('performanceId', ParseIntPipe) performanceId: number,
    @Param('seatId', SeatIdPipe) seatId: string,
    @Req() req: Request & { staff: Staff },
  ) {
    return { ...SeatResponseDto.from(this.seatsService.sell(performanceId, seatId)), soldBy: req.staff.name };
  }
}

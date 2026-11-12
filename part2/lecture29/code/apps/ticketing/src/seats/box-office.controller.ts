import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { SeatsService } from './seats.service.js';
import { SeatResponseDto } from './dto/seat-response.dto.js';
import { SeatIdPipe } from '../common/seat-id.pipe.js';
import { Roles } from '../common/roles.decorator.js';
import { CurrentStaff } from '../common/current-staff.decorator.js';
import type { Staff } from '../staff/staff.service.js';

@Controller('box-office/performances/:performanceId/seats')
@Roles(['clerk', 'manager'])
export class BoxOfficeController {
  constructor(private readonly seatsService: SeatsService) {}

  @Post(':seatId/sell')
  sell(
    @Param('performanceId', ParseIntPipe) performanceId: number,
    @Param('seatId', SeatIdPipe) seatId: string,
    @CurrentStaff() staff: Staff,
  ) {
    return { ...SeatResponseDto.from(this.seatsService.sell(performanceId, seatId)), soldBy: staff.name };
  }

  // 판매 취소: 실장만
  @Post(':seatId/release')
  @Roles(['manager'])
  release(
    @Param('performanceId', ParseIntPipe) performanceId: number,
    @Param('seatId', SeatIdPipe) seatId: string,
    @CurrentStaff() staff: Staff,
  ) {
    return { ...SeatResponseDto.from(this.seatsService.release(performanceId, seatId)), releasedBy: staff.name };
  }
}

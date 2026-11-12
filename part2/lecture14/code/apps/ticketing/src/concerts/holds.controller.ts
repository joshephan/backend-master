import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ConcertsService } from './concerts.service.js';

// 좌석은 회차에 딸린 것이라 회차 주소 아래에 둔다 (DB 전 메모리 껍데기)
@Controller('performances/:performanceId')
export class HoldsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get('seats')
  seats(@Param('performanceId') performanceId: string) {
    return this.concertsService.seats(+performanceId);
  }

  @Post('holds')
  hold(@Param('performanceId') performanceId: string, @Body('seat') seat: string) {
    return this.concertsService.hold(+performanceId, seat);
  }

  @Delete('holds/:holdId')
  @HttpCode(204)
  release(@Param('performanceId') performanceId: string, @Param('holdId') holdId: string) {
    this.concertsService.release(+performanceId, +holdId);
  }
}

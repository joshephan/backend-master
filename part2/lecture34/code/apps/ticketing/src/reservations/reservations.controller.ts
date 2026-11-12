import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { ReservationsService } from './reservations.service.js';
import { RefundsService } from './refunds.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly refunds: RefundsService,
    private readonly lazyModuleLoader: LazyModuleLoader,
  ) {}

  @Post()
  reserve(@Body() body: CreateReservationDto, @Headers('user-agent') userAgent = 'unknown') {
    return this.reservations.reserve(body.seatId, body.amount, body.buyer, body.channel, userAgent);
  }

  @Post('refund')
  refund(@Body() body: { approvalId: string }) {
    return this.refunds.refund(body.approvalId);
  }

  @Get(':id/receipt')
  async receipt(@Param('id') id: string) {
    const { ReceiptsModule } = await import('../receipts/receipts.module.js');
    const { ReceiptsService } = await import('../receipts/receipts.service.js');
    const moduleRef = await this.lazyModuleLoader.load(() => ReceiptsModule);
    return moduleRef.get(ReceiptsService).render(+id);
  }
}

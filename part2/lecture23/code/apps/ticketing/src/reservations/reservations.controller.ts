import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LazyModuleLoader } from '@nestjs/core';
import { ReservationsService } from './reservations.service.js';
import { RefundsService } from './refunds.service.js';

@Controller('reservations')
export class ReservationsController {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly refunds: RefundsService,
    private readonly lazyModuleLoader: LazyModuleLoader,
  ) {}

  @Post()
  reserve(
    @Body() body: { seatId: string; amount: number; buyer: string; channel?: string },
  ) {
    return this.reservations.reserve(body.seatId, body.amount, body.buyer, body.channel);
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

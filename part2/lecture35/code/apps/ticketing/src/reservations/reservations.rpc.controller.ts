import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { ReservationsService } from './reservations.service.js';

@Controller()
export class ReservationsRpcController {
  constructor(private readonly reservations: ReservationsService) {}

  @MessagePattern('reservations.find')
  find(@Payload() id: number) {
    const reservation = this.reservations.findOne(id);
    if (!reservation) {
      throw new RpcException({ code: 'RESERVATION_NOT_FOUND', message: `예매 ${id}번이 없습니다` });
    }
    return reservation;
  }
}

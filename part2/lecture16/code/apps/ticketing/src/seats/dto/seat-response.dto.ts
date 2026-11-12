import { seatLabel } from '@app/common';
import { Seat, SeatStatus } from '../entities/seat.entity.js';

export class SeatResponseDto {
  id: string;
  label: string;
  status: SeatStatus;

  static from(seat: Seat): SeatResponseDto {
    return { id: seat.id, label: seatLabel(seat.zone, seat.row, seat.no), status: seat.status };
  }
}

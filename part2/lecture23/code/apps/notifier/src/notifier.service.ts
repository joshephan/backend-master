import { Injectable } from '@nestjs/common';
import { seatLabel } from '@app/common';

@Injectable()
export class NotifierService {
  getHello(): string {
    return `알림: ${seatLabel('A', 3, 15)} 예매 확정`;
  }
}

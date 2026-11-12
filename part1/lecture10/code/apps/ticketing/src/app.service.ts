import { Injectable } from '@nestjs/common';
import { seatLabel } from '@app/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `예매 API: ${seatLabel('A', 3, 15)}`;
  }
}

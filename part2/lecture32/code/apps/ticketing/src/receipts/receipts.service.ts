import { Injectable } from '@nestjs/common';

// 무거운 PDF 라이브러리를 불러오는 데 0.8초가 걸린다고 가정한 자리
const started = Date.now();
while (Date.now() - started < 800) {}
console.log('영수증 모듈 코드 불러옴 (0.8초)');

@Injectable()
export class ReceiptsService {
  render(reservationId: number) {
    return `영수증 PDF: 예매 ${reservationId}번`;
  }
}

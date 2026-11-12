import { HttpException } from '@nestjs/common';

// 문제 종류(type)와 추가 필드를 함께 싣는 예외
export class ProblemException extends HttpException {
  constructor(
    status: number,
    readonly type: string,
    readonly title: string,
    detail: string,
    readonly extensions: Record<string, unknown> = {},
  ) {
    super(detail, status);
  }
}

export class SeatAlreadyHeldException extends ProblemException {
  constructor(seat: string) {
    super(409, 'https://api.ticketing.example/problems/seat-already-held', '이미 선점된 좌석', `${seat} 좌석은 다른 손님이 선점했습니다.`, { seat });
  }
}

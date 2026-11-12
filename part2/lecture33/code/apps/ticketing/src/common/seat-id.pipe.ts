import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

// 좌석 번호를 대문자로 맞추고 형식(구역-열-번호)을 검사한다. 예: a-1-5 → A-1-5
@Injectable()
export class SeatIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    const seatId = value.trim().toUpperCase();
    if (!/^[A-Z]-\d{1,2}-\d{1,2}$/.test(seatId)) {
      throw new BadRequestException(`${metadata.data} 형식이 아닙니다: ${value} (예: A-3-15)`);
    }
    return seatId;
  }
}

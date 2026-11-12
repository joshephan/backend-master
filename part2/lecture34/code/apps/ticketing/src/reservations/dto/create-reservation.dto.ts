import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateReservationDto {
  @Matches(/^[A-Z]-\d{1,2}-\d{1,2}$/, { message: 'seatId는 A-3-15 형식이어야 합니다' })
  seatId: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  buyer: string;

  @IsOptional()
  @IsIn(['sms', 'email', 'push'])
  channel?: string;
}

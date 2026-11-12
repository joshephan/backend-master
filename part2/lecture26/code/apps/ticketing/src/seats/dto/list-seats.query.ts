import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import type { SeatStatus } from '../entities/seat.entity.js';

export class ListSeatsQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  row?: number;

  @IsOptional()
  @IsIn(['AVAILABLE', 'HELD', 'SOLD'])
  status?: SeatStatus;
}

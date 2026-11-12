import { IsInt, IsISO8601, Min } from 'class-validator';

export class CreatePerformanceDto {
  @IsInt()
  @Min(1)
  concertId: number;

  @IsISO8601()
  startsAt: string;
}

import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreatePerformanceDto } from './create-performance.dto.js';

// 회차의 공연(concertId)은 변경 불가
export class UpdatePerformanceDto extends PartialType(OmitType(CreatePerformanceDto, ['concertId'] as const)) {}

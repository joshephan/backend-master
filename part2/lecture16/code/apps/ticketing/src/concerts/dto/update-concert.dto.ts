import { PartialType } from '@nestjs/mapped-types';
import { CreateConcertDto } from './create-concert.dto.js';

export class UpdateConcertDto extends PartialType(CreateConcertDto) {}

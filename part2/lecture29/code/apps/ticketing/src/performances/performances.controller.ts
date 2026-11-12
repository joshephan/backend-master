import {
  Body, Controller, Delete, Get, Header, HttpCode, Param, ParseIntPipe, Patch, Post, Query,
} from '@nestjs/common';
import { PerformancesService } from './performances.service.js';
import { CreatePerformanceDto } from './dto/create-performance.dto.js';
import { UpdatePerformanceDto } from './dto/update-performance.dto.js';
import { PerformanceResponseDto } from './dto/performance-response.dto.js';

@Controller('performances')
export class PerformancesController {
  constructor(private readonly performancesService: PerformancesService) {}

  @Post()
  create(@Body() createPerformanceDto: CreatePerformanceDto) {
    return PerformanceResponseDto.from(this.performancesService.create(createPerformanceDto));
  }

  @Get()
  findAll(@Query('concertId', new ParseIntPipe({ optional: true })) concertId?: number) {
    return this.performancesService.findAll(concertId).map(PerformanceResponseDto.from);
  }

  @Get('upcoming')
  findUpcoming() {
    return this.performancesService.findUpcoming().map(PerformanceResponseDto.from);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return PerformanceResponseDto.from(this.performancesService.findOne(id));
  }

  @Get(':id/ics')
  @Header('Content-Type', 'text/calendar')
  downloadIcs(@Param('id', ParseIntPipe) id: number) {
    return this.performancesService.toIcs(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePerformanceDto: UpdatePerformanceDto) {
    return this.performancesService.update(id, updatePerformanceDto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.performancesService.remove(id);
  }
}

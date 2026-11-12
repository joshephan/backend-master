import { Controller, Get, Param, ParseIntPipe, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { log, MethodInterceptor, TraceFilter, TraceGuard, TraceInterceptor, TracePipe } from './trace.js';

@Controller('trace')
@UseGuards(TraceGuard)
@UseInterceptors(TraceInterceptor)
@UseFilters(TraceFilter)
export class TraceController {
  @Get(':id')
  @UseInterceptors(MethodInterceptor)
  find(@Param('id', TracePipe, ParseIntPipe) id: number) {
    log(`5 핸들러 id=${id}`);
    if (id === 0) throw new Error('핸들러에서 터짐');
    return { id };
  }
}

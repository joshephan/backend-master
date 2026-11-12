import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { StaffService, type Staff } from '../staff/staff.service.js';

// 매표소 직원만 들여보낸다. 찾은 직원은 req.staff에 싣는다
@Injectable()
export class StaffKeyGuard implements CanActivate {
  private readonly logger = new Logger('StaffKeyGuard');

  constructor(private readonly staffService: StaffService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { staff?: Staff }>();
    this.logger.log(`${context.getType()} ${context.getClass().name}.${context.getHandler().name}`);

    const staff = await this.staffService.verify(req.header('x-staff-key'));
    if (!staff) throw new UnauthorizedException('직원 키가 없거나 맞지 않습니다');
    if (staff.role === 'planner') throw new ForbiddenException(`${staff.name}님은 매표 권한이 없습니다`);

    req.staff = staff;
    return true;
  }
}

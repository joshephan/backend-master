import {
  CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { StaffService, type Staff } from '../staff/staff.service.js';
import { Roles } from './roles.decorator.js';

// Roles 표시가 붙은 핸들러만 직원 키를 확인한다. 찾은 직원은 req.staff에 싣는다
@Injectable()
export class StaffKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly staffService: StaffService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
    if (!roles) return true; // 표시 없음: 손님용

    const req = context.switchToHttp().getRequest<Request & { staff?: Staff }>();
    const staff = await this.staffService.verify(req.header('x-staff-key'));
    if (!staff) throw new UnauthorizedException('직원 키가 없거나 맞지 않습니다');
    if (!roles.includes(staff.role)) throw new ForbiddenException(`${staff.name}님은 이 작업 권한이 없습니다`);

    req.staff = staff;
    return true;
  }
}

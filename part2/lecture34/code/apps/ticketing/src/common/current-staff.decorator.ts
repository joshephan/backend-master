import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Staff } from '../staff/staff.service.js';

// StaffKeyGuard가 req.staff에 실어 둔 직원을 핸들러 인자로
export const CurrentStaff = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Staff => ctx.switchToHttp().getRequest().staff,
);

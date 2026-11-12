import { Reflector } from '@nestjs/core';
import type { StaffRole } from '../staff/staff.service.js';

// 이 핸들러(또는 컨트롤러)를 쓸 수 있는 직원 역할. 붙어 있지 않으면 손님용
export const Roles = Reflector.createDecorator<StaffRole[]>();

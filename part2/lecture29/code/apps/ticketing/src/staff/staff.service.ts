import { Injectable } from '@nestjs/common';

export type StaffRole = 'clerk' | 'manager' | 'planner';

export interface Staff {
  name: string;
  role: StaffRole;
}

@Injectable()
export class StaffService {
  // 직원 키 → 직원. DB 대신 메모리
  private readonly staff = new Map<string, Staff>([
    ['key-kim', { name: '김매표', role: 'clerk' }],
    ['key-lee', { name: '이실장', role: 'manager' }],
    ['key-park', { name: '박기획', role: 'planner' }],
  ]);

  // DB 조회를 흉내 낸 비동기 메서드
  async verify(key: string | undefined): Promise<Staff | undefined> {
    await new Promise((r) => setTimeout(r, 5));
    return key ? this.staff.get(key) : undefined;
  }
}

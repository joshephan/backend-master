# 32강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | node -v | 2026-10-26 |
| 테스트 도구 | vitest 4.1.12 (Nest CLI 12 새 프로젝트 기본) | 실습 프로젝트 package.json | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| 테스트 도구 | 실습 프로젝트 package.json | 2026-10-26 |
| 좌석 유닛 테스트 | 실습 환경 실측, Node v24.11.0 | 2026-10-26 |
| 진짜 결제사 클라이언트 테스트 | 실습 환경 실측, 로컬 가짜 결제사 5032 | 2026-10-26 |
| 전체 유닛 테스트 | 실습 환경 실측 | 2026-10-26 |
| 가짜 타이머 API | vitest 4 문서 | 2026-10-26 |
| 테스트 더블 다섯 가지 이름 | Gerard Meszaros, "xUnit Test Patterns" (2007) | 2007 |

## 참고 자료

- NestJS 공식 문서, Testing: https://docs.nestjs.com/fundamentals/testing
- Vitest 문서, Mocking: https://vitest.dev/guide/mocking
- Vitest 문서, Vi API(vi.fn, vi.spyOn, vi.useFakeTimers, vi.setSystemTime): https://vitest.dev/api/vi
- Gerard Meszaros, "xUnit Test Patterns: Refactoring Test Code" (2007)

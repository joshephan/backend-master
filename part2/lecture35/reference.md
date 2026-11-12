# 35강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| 실행 환경 | Windows 11, Node v24.11.0 | node -v | 2026-10-26 |
| supertest | 7.3.1, @types/supertest 7.2.1 | npm ls | 2026-10-26 |
| Nest CLI | 12.0.10 (generate app으로 앱을 나눌 때 test:e2e 스크립트가 바뀜) | nest -v | 2026-10-25 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| supertest | 실습 프로젝트 npm ls | 2026-10-26 |
| e2e 실행 | 실습 환경 실측, Node v24.11.0 | 2026-10-26 |
| 흐름 테스트 시간 | 실습 환경 실측 | 2026-10-26 |
| test:e2e 스크립트 치환 | Nest CLI 12.0.10 generate app | 2026-10-25 |
| Windows 명령 없음 메시지 | 실습 환경(Windows 11) | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Testing(End-to-end testing): https://docs.nestjs.com/fundamentals/testing
- supertest: https://github.com/ladjs/supertest
- Vitest 문서, Test API(test.todo): https://vitest.dev/api/
- Testcontainers for Node.js, PostgreSQL 모듈: https://node.testcontainers.org/modules/postgresql/
- Martin Fowler, "The Practical Test Pyramid": https://martinfowler.com/articles/practical-test-pyramid.html

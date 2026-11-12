# 24강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/core 12.2.0 | `npm ls` | 2026-10-26 |
| Express | 5.3.0(기본 라우팅: 대소문자 구분 안 함, 끝 슬래시 무시) | `npm ls` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 요청 로그의 처리 시간은 환경마다 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS·Express | npm ls | 2026-10-26 |
| Express 라우팅 기본값 | `/Box-Office/…`, `…/sell/` 요청 실측 | 2026-10-26 |
| 가드가 false일 때 본문 | @nestjs/core 12.2.0 실측 | 2026-10-26 |
| 가드 포함 판매 요청 시간 | 실습 PC 실측 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Guards: https://docs.nestjs.com/guards
- NestJS 공식 문서, Execution context: https://docs.nestjs.com/fundamentals/execution-context
- NestJS 공식 문서, Built-in HTTP exceptions: https://docs.nestjs.com/exception-filters#built-in-http-exceptions
- RFC 9110, 401 Unauthorized: https://www.rfc-editor.org/rfc/rfc9110#name-401-unauthorized
- RFC 9110, 403 Forbidden: https://www.rfc-editor.org/rfc/rfc9110#name-403-forbidden
- Express 문서, Routing: https://expressjs.com/en/guide/routing.html

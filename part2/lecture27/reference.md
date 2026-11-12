# 27강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | node -v | 2026-10-26 |
| NestJS | @nestjs/common·core 12.2.0 | npm ls | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS | npm ls | 2026-10-26 |
| 전역 필터 고르는 순서 | 등록 다섯 가지 실측 | 2026-10-26 |
| http-errors 413 | body-parser 에러 객체 | 2026-10-26 |
| 처리 안 된 Promise 실패 | Node v24.11.0 실측 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Exception filters: https://docs.nestjs.com/exception-filters
- NestJS 공식 문서, Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- RFC 9457, Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457
- Node.js 공식 문서, process의 'unhandledRejection' 이벤트와 `--unhandled-rejections`: https://nodejs.org/api/process.html
- http-errors: https://github.com/jshttp/http-errors

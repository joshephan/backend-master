# 23강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/core·platform-express 12.2.0 | `npm ls` | 2026-10-26 |
| Express | 5.3.0 | `npm ls` | 2026-10-26 |
| body parser JSON 기본 상한 | 100KB(102,400바이트) | PayloadTooLargeError 출력 | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 요청 로그의 처리 시간은 환경마다 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS·Express | npm ls | 2026-10-26 |
| body parser JSON 기본 상한 | PayloadTooLargeError 출력, body-parser 기본값 | 2026-10-26 |
| 요청 로그 처리 시간 | 실습 PC 실측, Node v24.11.0 | 2026-10-26 |
| Nest 기본 처리의 413 본문 | 전역 필터를 뺀 실측 | 2026-10-26 |
| 좌석 배치 JSON 크기 | 실습용으로 만든 좌석 배치 파일 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Middleware: https://docs.nestjs.com/middleware
- NestJS 공식 문서, Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- Express 문서, Using middleware: https://expressjs.com/en/guide/using-middleware.html
- Express 문서, Writing middleware: https://expressjs.com/en/guide/writing-middleware.html
- body-parser README(limit 옵션): https://github.com/expressjs/body-parser
- Node.js 문서, http.ServerResponse의 finish 이벤트: https://nodejs.org/api/http.html#class-httpserverresponse
- Node.js 문서, crypto.randomUUID(): https://nodejs.org/api/crypto.html#cryptorandomuuidoptions

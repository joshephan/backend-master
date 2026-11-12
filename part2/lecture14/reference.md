# 14강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | @nestjs/common·core·platform-express 12.2.0 | `npm ls` | 2026-10-26 |
| HTTP 어댑터 | Express | 응답 헤더 `X-Powered-By: Express` | 2026-10-26 |
| curl | Windows용 curl | `curl --version` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 응답의 `Keep-Alive: timeout=65`와 `Transfer-Encoding: chunked`는 10강에서 넣은 keepAliveTimeout과 compression 때문이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 npm ls | 2026-10-26 |
| HTTP 어댑터 | 응답 헤더 | 2026-10-26 |
| ParseIntPipe 메시지 | 실행 출력 | 2026-10-26 |
| ParseIntPipe optional 옵션 | Nest 12.2.0에서 실행 확인 | 2026-10-26 |
| 응답 헤더 | main.ts의 keepAliveTimeout 65초 | 2026-10-26 |
| 빈 200의 헤더 | compression 1.8.2를 거친 응답 | 2026-10-26 |
| curl 타임아웃 문구 | Windows용 curl | 2026-10-26 |

## 참고 자료

- NestJS 문서, Controllers(라우팅, `@Param`·`@Query`·`@Body`, `@HttpCode`, `@Header`, `@Res`의 passthrough): https://docs.nestjs.com/controllers
- NestJS 문서, Pipes(`ParseIntPipe`): https://docs.nestjs.com/pipes
- NestJS 문서, Exception filters(`NotFoundException`): https://docs.nestjs.com/exception-filters
- IETF RFC 5545 iCalendar: https://www.rfc-editor.org/rfc/rfc5545

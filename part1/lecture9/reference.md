# 9강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | @nestjs/common·core·platform-express 12.2.0 | `npm ls` | 2026-10-26 |
| Express | 5.3.0 | `node_modules/@nestjs/platform-express/package.json` | 2026-10-26 |
| undici | 6.20.1 | `node_modules/undici/package.json` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS | npm ls | 2026-10-26 |
| Express | node_modules/@nestjs/platform-express/package.json | 2026-10-26 |
| 없는 메서드 응답 | 직접 실측 | 2026-10-26 |
| HEAD 자동 처리, OPTIONS 404 | 직접 실측 | 2026-10-26 |
| undici 재시도 기본 메서드 | undici 6.20.1 lib/handler/retry-handler.js 48행 | 2026-10-26 |
| 안전한·멱등한 메서드 정의 | IETF RFC 9110 HTTP Semantics | 2022-06 |
| GitHub 비공개 저장소 404 | GitHub REST API 문서(인증, 문제 해결) | 2026-10-26 |
| Node | node -v | 2026-10-26 |

## 참고 자료

- IETF RFC 9110 HTTP Semantics. 9.2.1 안전한 메서드, 9.2.2 멱등한 메서드, 15장 상태 코드: https://www.rfc-editor.org/rfc/rfc9110
- NestJS 문서, Controllers(라우트 데코레이터, `@HttpCode`): https://docs.nestjs.com/controllers
- NestJS 문서, Exception filters(내장 HTTP 예외): https://docs.nestjs.com/exception-filters
- MDN, HTTP response status codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
- undici 저장소(Node의 fetch 구현): https://github.com/nodejs/undici
- GitHub REST API 문서, Troubleshooting(비공개 저장소에 404를 주는 경우)

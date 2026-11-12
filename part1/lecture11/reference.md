# 11강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | 12.2.0 | `npm ls` | 2026-10-26 |
| class-validator, class-transformer | 검증 실패 확인에만 설치(`--no-save`) | `npm install --no-save` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 500 응답의 스택 줄 번호는 빌드 결과에 따라 달라진다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS | npm ls | 2026-10-26 |
| class-validator, class-transformer | npm | 2026-10-26 |
| Nest 기본 에러 본문 | 직접 실측 | 2026-10-26 |
| Problem Details 표준 | IETF | 2026-10-26 |
| JSON.parse 오류 문구 | Node v24.11.0 | 2026-10-26 |
| Express 어댑터의 +json 처리 | @nestjs/platform-express 12.2.0 express-adapter.js | 2026-10-26 |

## 참고 자료

- IETF RFC 9457 Problem Details for HTTP APIs(2023): https://www.rfc-editor.org/rfc/rfc9457
- IETF RFC 7807 Problem Details for HTTP APIs(2016, RFC 9457로 대체): https://www.rfc-editor.org/rfc/rfc7807
- NestJS 문서, Exception filters: https://docs.nestjs.com/exception-filters
- NestJS 문서, Validation: https://docs.nestjs.com/techniques/validation
- Node.js 문서, `http.STATUS_CODES`: https://nodejs.org/api/http.html#httpstatus_codes

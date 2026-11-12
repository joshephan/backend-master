# 12강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | @nestjs/platform-express 12.2.0 | `npm ls` | 2026-10-26 |
| multer | 2.4.0 (@nestjs/platform-express 의존성) | `package.json` | 2026-10-26 |
| @msgpack/msgpack | 3.1.3 (비교에만 설치) | `npm ls` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 시간과 메모리 값은 같은 PC 안에서 잰 것이라 환경마다 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node | node -v | 2026-10-26 |
| JSON 함정 다섯 줄 | 직접 실측 | 2026-10-26 |
| X API 문자열 ID | X 개발자 문서 Twitter IDs | 2026-10-26 |
| 좌석 지도 직렬화 | 직접 실측, 7회 중 가운데 5회 | 2026-10-26 |
| MessagePack | 직접 실측 | 2026-10-26 |
| multer | package.json | 2026-10-26 |
| 업로드 메모리 | 직접 실측, rss 50ms 간격 | 2026-10-26 |
| 내려받기 메모리 | 직접 실측, rss 50ms 간격 | 2026-10-26 |

## 참고 자료

- NestJS 문서, File upload: https://docs.nestjs.com/techniques/file-upload
- NestJS 문서, Streaming files(`StreamableFile`): https://docs.nestjs.com/techniques/streaming-files
- Node.js 문서, Stream: https://nodejs.org/api/stream.html
- Node.js 문서, File system(`createReadStream`, `readFile`): https://nodejs.org/api/fs.html
- MDN, `JSON.stringify()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
- MDN, `Number.MAX_SAFE_INTEGER`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
- MessagePack 명세: https://github.com/msgpack/msgpack/blob/master/spec.md
- @msgpack/msgpack 저장소: https://github.com/msgpack/msgpack-javascript
- multer 저장소: https://github.com/expressjs/multer
- IETF RFC 7578 Returning Values from Forms: multipart/form-data: https://www.rfc-editor.org/rfc/rfc7578
- X 개발자 문서, Twitter IDs(`id`와 `id_str`)

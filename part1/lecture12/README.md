# 12강. 직렬화, 파일 업로드, 스트리밍 응답

제1부 기반: 백엔드와 Node.js 런타임 · 3장 HTTP 기초

[← 11강](../../part1/lecture11/) | [제1부 목록](../) | [13강 →](../../part2/lecture13/)

## 이번 강의 질문

객체가 바이트로, 바이트가 객체로 바뀔 때 무엇이 사라지고, 큰 데이터는 메모리에 다 올리지 않고 어떻게 주고받나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 11강 끝 코드([../../part1/lecture11/code/](../../part1/lecture11/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 이 강에서 `@types/multer`를 개발 의존성으로 더하고 `tsconfig.json`의 `types`에 `"multer"`를 넣었다. multer 자체는 `@nestjs/platform-express`에 들어 있다.

```bash
cd code
npm install
npx nest build
PORT=4012 node dist/apps/ticketing/main.js
```

판매 내역 내려받기는 환경 변수 `EXPORT_FILE`(기본값 `sales.csv`)이 가리키는 파일을 흘려보낸다. 아무 큰 CSV 파일을 두고 경로를 지정한다. 아래 실행 결과에 쓴 파일은 320만 줄, 212,136,890바이트였다.

업로드용 시험 파일은 무작위 바이트로 만들고 이름만 `.jpg`로 둔다.

```bash
dd if=/dev/urandom of=poster-3mb.jpg bs=1M count=3
dd if=/dev/urandom of=poster-200mb.jpg bs=1M count=200
curl -F file=@poster-3mb.jpg localhost:4012/concerts/1/poster
curl -F file=@poster-200mb.jpg localhost:4012/concerts/1/poster
curl -s -o /dev/null -w '%{time_starttransfer} %{time_total}\n' localhost:4012/concerts/1/sales-export
curl -s -o /dev/null --limit-rate 50M localhost:4012/concerts/1/sales-export
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/files/files.controller.ts](code/apps/ticketing/src/files/files.controller.ts) | 포스터 업로드 `POST /concerts/:id/poster`(multer `limits.fileSize` 5MB, 넘으면 413), 판매 내역 `GET /concerts/:id/sales-export`(`createReadStream`을 `StreamableFile`로 흘려보냄) |
| [code/apps/ticketing/src/concerts/concerts.module.ts](code/apps/ticketing/src/concerts/concerts.module.ts) | `FilesController` 등록 |
| [code/apps/ticketing/src/concerts/concerts.controller.ts](code/apps/ticketing/src/concerts/concerts.controller.ts) | 500 응답을 보이던 `GET /concerts/:id/sales` 삭제 |
| [code/package.json](code/package.json), [code/tsconfig.json](code/tsconfig.json) | `@types/multer` 추가, `types`에 `multer` |

### 실행 결과

JSON 직렬화에서 바뀌거나 사라지는 값(아래 "해 볼 때 참고"의 `json-pitfalls.mjs`). 큰 정수 ID의 원래 값은 9007199254740993, Date의 원래 값은 2026-11-01 10:00(+09:00)이다.

```
$ node json-pitfalls.mjs
BigInt: TypeError: Do not know how to serialize a BigInt
큰 정수 ID: 9007199254740992
Date: {"openAt":"2026-11-01T01:00:00.000Z"} string
Map: {"holds":{}}
undefined: {"seat":"A-3-15"}
```

좌석 5만 개 지도(20구역 x 50열 x 50석)를 직렬화한 시간(7회 중 가운데 5회)과 MessagePack 비교.

| 형식 | 크기 | 만들기 | 읽기 | brotli 4 뒤 |
|---|---|---|---|---|
| JSON | 3,115KB | 12~15ms | 12~18ms | 174KB |
| MessagePack | 2,107KB | 12~30ms | 17~42ms | 190KB |

MessagePack 결과의 첫 16바이트. `dc c350`은 원소 50,000개 배열, `85`는 항목 5개 맵, `a2 6964`는 문자열 "id", `a5 412d312d31`은 문자열 "A-1-1"이다.

```
MessagePack 첫 16바이트: dcc35085a26964a5412d312d31a47a6f
```

3MB 포스터 업로드.

```
$ curl -F file=@poster-3mb.jpg localhost:4012/concerts/1/poster
{"name":"poster-3mb.jpg","size":3145728,"mimetype":"image/jpeg"}
```

200MB 파일을 검사 파이프(`ParseFilePipe` + `MaxFileSizeValidator`)로만 막은 경우. 파일을 다 받은 뒤에 검사가 돈다.

```
$ curl -F file=@poster-200mb.jpg localhost:4012/concerts/1/poster-unlimited
{"type":"about:blank","title":"Bad Request","status":400,
 "detail":"Validation failed (current file size is 209715200, expected size is less than 5242880)", ...}
```

200MB 파일을 multer `limits`로 막은 경우. 5MB를 넘는 순간 받기를 멈추고 413을 준다.

```
$ curl -F file=@poster-200mb.jpg localhost:4012/concerts/1/poster
{"type":"about:blank","title":"Payload Too Large","status":413,
 "detail":"File too large","instance":"/concerts/1/poster"}
```

두 방식의 서버 메모리(`process.memoryUsage().rss`를 50ms마다 기록, 시작 약 95MB).

| 200MB 업로드 | 응답 | 서버 메모리 최고 | 응답 뒤 |
|---|---|---|---|
| 검사 파이프만 | 400 | 499~500MB | 499MB |
| multer limits | 413 | 154~177MB | 98~112MB |

판매 내역 212,136,890바이트를 통째로(`readFile`) 보낼 때와 흘려보낼 때(시작 약 95MB).

| 내려받기 212,136,890 bytes | 통째로 (readFile) | 흘려보내기 (stream) |
|---|---|---|
| 한 명, 메모리 최고 | 299MB | 96~147MB |
| 다섯 명 동시, 메모리 최고 | 1,108~1,109MB | 169~172MB |
| 첫 바이트까지 | 0.17~0.32초 | 0.007~0.022초 |

초당 50MB로 받는 고객(`curl --limit-rate 50M`)에게 흘려보냈을 때는 4.06초가 걸렸고 메모리 최고는 163MB였다.

### 해 볼 때 참고

- JSON 함정 다섯 줄은 프로젝트 밖의 스크립트로 확인했다.

```js
// json-pitfalls.mjs
try { JSON.stringify({ amount: 10n }); } catch (e) { console.log('BigInt:', e.constructor.name + ':', e.message); }
console.log('큰 정수 ID:', JSON.parse('{"id":9007199254740993}').id);
const back = JSON.parse(JSON.stringify({ openAt: new Date('2026-11-01T10:00:00+09:00') }));
console.log('Date:', JSON.stringify(back), typeof back.openAt);
console.log('Map:', JSON.stringify({ holds: new Map([['A-3-15', 1]]) }));
console.log('undefined:', JSON.stringify({ seat: 'A-3-15', memo: undefined }));
```

- MessagePack 비교는 `@msgpack/msgpack`을 잠시 설치해 하고 지웠다. 프로젝트 코드에는 없다. 64비트 정수를 그대로 왕복하려면 `encode`·`decode` 양쪽에 `{ useBigInt64: true }`를 준다
- 다 받은 뒤 검사하는 나쁜 예는 프로젝트 코드에서 지웠다. `limits` 없이 `FileInterceptor('file')`만 걸고 `@UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * MB })] }))`로 받는 라우트를 하나 더 만들면 위 400 응답과 메모리 그래프가 나온다
- 통째로 보내는 나쁜 예도 지웠다. `@Res() res`로 받아 `const data = await readFile(EXPORT_FILE); res.type('text/csv').send(data);`로 보내는 라우트를 만들면 비교할 수 있다. 다섯 명 동시 요청은 `for i in 1 2 3 4 5; do curl -s -o /dev/null URL & done; wait`로 보낸다
- 메모리는 서버 프로세스 안에서 50ms마다 `process.memoryUsage().rss`의 최고값을 기록해 쟀다. `node --import <기록 모듈> dist/apps/ticketing/main.js`처럼 띄우면 서버 코드를 고치지 않고 붙일 수 있다
- 서버가 받은 `mimetype`은 고객 앱이 보낸 값이다. curl은 확장자로 정해서 무작위 바이트 파일도 `image/jpeg`가 된다. 파일 종류는 앞부분 바이트(매직 넘버)를 직접 봐야 안다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node | v24.11.0 | 2026-10-26 |
| JSON 함정 다섯 줄 | BigInt 오류, 2^53 넘는 정수 변형, Date의 UTC 문자열화, Map의 빈 객체, undefined 필드 누락(실습 자료의 실행 결과 참고) | 2026-10-26 |
| X API 문자열 ID | id와 함께 id_str 제공, JavaScript에서 숫자 ID가 바뀔 수 있음 | 2026-10-26 |
| 좌석 지도 직렬화 | stringify 12~15ms, parse 12~18ms, 3,115KB | 2026-10-26 |
| MessagePack | @msgpack/msgpack 3.1.3, 2,107KB, 만들기 12~30ms, 읽기 17~42ms, brotli 4 뒤 190KB(JSON 174KB) | 2026-10-26 |
| multer | 2.4.0 (@nestjs/platform-express 12.2.0 의존성) | 2026-10-26 |
| 업로드 메모리 | 검사 파이프만 최고 499~500MB, multer limits 최고 154~177MB (200MB 파일, 시작 약 95MB) | 2026-10-26 |
| 내려받기 메모리 | 통째로 최고 299MB(다섯 명 1,108~1,109MB), 흘려보내기 최고 96~147MB(다섯 명 169~172MB), 초당 50MB 고객 163MB (212,136,890바이트 파일, 시작 약 95MB) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 응답용 DTO와 직렬화 인터셉터 | [16강](../../part2/lecture16/), [28강](../../part2/lecture28/) |
| 콘텐츠 타입 협상(Accept) | 50강 |
| 서버 사이 바이너리 프로토콜(gRPC) | 56강 |
| SSE 같은 이벤트 스트림 | 58강 |
| 좌석 지도 캐시 | 122~124강 |
| 업로드 파일 종류 검사와 보안 | 153강 |
| 백프레셔 | 226강 |
| 객체 스토리지와 사전 서명 URL | 300강 |
| 워커 스레드로 직렬화 넘기기 | [7강](../../part1/lecture7/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

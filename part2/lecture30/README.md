# 30강. Express와 Fastify 어댑터

제2부 NestJS 핵심 · 7장 수명주기와 플랫폼

[← 29강](../../part2/lecture29/) | [제2부 목록](../) | [31강 →](../../part2/lecture31/)

## 이번 강의 질문

NestJS 앱 아래의 HTTP 서버를 Express에서 Fastify로 바꾸면 무엇이 그대로고 무엇이 바뀌며, 바꿀 만한지는 어떻게 정하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 24(실행 환경은 Windows, Node v24.11.0). Docker는 필요 없다
- 29강 끝 코드([../../part2/lecture29/code/](../../part2/lecture29/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 이 프로젝트는 Express를 유지하므로 code/에는 Fastify로 바꾼 코드가 없다. Fastify 실험은 아래 "해 볼 때 참고"를 따라 직접 바꿔 본다
- `code/`에 `.env` 파일을 만든다. main.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 서버가 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- 문자 발송사가 응답하지 않으면 부팅이 멈춘다(SmsOutbox의 onModuleInit). [29강](../../part2/lecture29/)의 가짜 외부 서버를 포트 5030에 먼저 띄운다
- `code/`에서 `npm install` 뒤 아래처럼 서버를 띄운다

```bash
PORT=4030 PAYMENT_MODE=fake SMS_URL=http://localhost:5030/sms PG_URL=http://localhost:5030 npm run start
```

요청 본문 파일:

```bash
node -e "require('fs').writeFileSync('concert.json', JSON.stringify({title:'가을 콘서트',venue:'올림픽홀'}))"
node -e "process.stdout.write(JSON.stringify({title:'x'.repeat(200*1024),venue:'올림픽홀'}))" > big200k.json
node -e "process.stdout.write(JSON.stringify({title:'x'.repeat(2*1024*1024),venue:'올림픽홀'}))" > big2m.json
node -e "require('fs').writeFileSync('rsv-bench.json', JSON.stringify({seatId:'A-3-15',amount:50000,buyer:'010-1111-2222',channel:'email'}))"
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/reservations/reservations.controller.ts](code/apps/ticketing/src/reservations/reservations.controller.ts) | 예매 핸들러가 `@Headers('user-agent') userAgent = 'unknown'`으로 User-Agent를 받음. Express 요청 객체(`@Req()`)를 쓰지 않음 |
| [code/apps/ticketing/src/reservations/reservations.service.ts](code/apps/ticketing/src/reservations/reservations.service.ts) | 예매 기록에 userAgent 칸, 결제 완료 로그 괄호에 User-Agent |

### 실행 결과

main.ts의 두 줄(import, `NestFactory.create`의 어댑터)만 Fastify로 바꿨을 때. 라우트를 등록하기 전에 프로세스가 끝난다:

```text
$ node dist/apps/ticketing/main.js
[Nest] <프로세스 번호>  - 2026. 10. 26. 오후 4:56:48     LOG [NestFactory] Starting Nest application...
...
[Nest] <프로세스 번호>  - 2026. 10. 26. 오후 4:56:48   ERROR [ExceptionHandler] TypeError: str is not iterable
    at parse (.../node_modules/path-to-regexp/dist/index.js:55:23)
    at process (.../node_modules/path-to-regexp/dist/index.js:263:56)
    at pathToRegexp (.../node_modules/path-to-regexp/dist/index.js:274:5)
    at Object.use (.../node_modules/@fastify/middie/lib/engine.js:34:26)
    at Object.use (.../node_modules/@fastify/middie/index.js:67:21)
    at FastifyAdapter.use (.../node_modules/@nestjs/platform-fastify/adapters/fastify-adapter.js:846:30)
    at NestApplication.use (.../node_modules/@nestjs/core/nest-application.js:254:26)
```

`app.use(requestId, requestLog)`를 두 줄로 나눈 뒤. 부팅은 되지만 모든 요청이 500이고, 고객 앱이 받는 본문에 내부 에러 문구가 그대로 나간다:

```text
$ curl -i localhost:4030/concerts
HTTP/1.1 500 Internal Server Error
content-type: application/json; charset=utf-8

{"statusCode":500,"error":"Internal Server Error","message":"res.status(...).type(...).json is not a function"}
```

```text
ERROR [ProblemDetails] TypeError: req.header is not a function
    at requestId (.../dist/apps/ticketing/main.js:517:20)
    at Holder.done (.../node_modules/@fastify/middie/lib/engine.js:149:11)
```

express에서 타입을 가져온 파일. 미들웨어 둘, 예외 필터 둘, 가드, 인터셉터, 예매 컨트롤러로 일곱 파일이다:

```text
$ grep -rn "from 'express'" apps/ticketing/src
common/domain-error.filter.ts:2:   import type { Request, Response } from 'express';
common/problem-details.filter.ts:3: import type { Request, Response } from 'express';
common/request-id.middleware.ts:2:  import type { NextFunction, Request, Response } from 'express';
common/request-log.middleware.ts:2: import type { NextFunction, Request, Response } from 'express';
common/staff-key.guard.ts:5:        import type { Request } from 'express';
common/timing.interceptor.ts:2:     import type { Request, Response } from 'express';
reservations/reservations.controller.ts:2: import type { Request } from 'express';
```

Fastify로 바꾼 코드에서도 타입 검사는 통과한다. `import type`은 빌드 결과에서 사라진다:

```text
$ npx tsc --noEmit -p apps/ticketing/tsconfig.app.json
tsc exit=0
```

미들웨어·필터·가드를 고친 뒤에도 예매 컨트롤러가 `@Req()`의 `req.get()`을 쓰는 동안은 예매만 500이다:

```text
$ curl -X POST localhost:4030/reservations -A 'TicketApp/3.2 (iOS 18)' ...
{"type":"about:blank","title":"Internal Server Error","status":500,"detail":"요청을 처리하지 못했습니다.","instance":"/reservations"}
```

```text
LOG [Timing] b591f975-fefe-4df9-8a45-9618d1a59203 ReservationsController.reserve 실패(TypeError) 1.0ms
ERROR [ProblemDetails] TypeError: req.get is not a function
```

`@Headers('user-agent')`로 바꾼 뒤:

```text
[201]
[예매] A-3-15 결제 완료 (TicketApp/3.2 (iOS 18))
```

고친 코드를 두 어댑터로 각각 띄워 같은 요청을 보낸 결과:

| 요청 | Express | Fastify |
|---|---|---|
| 예매 | 201 | 201 |
| 없는 공연 99번 | 404, detail "공연 99번이 없습니다" | 같음 |
| 매표소 판매 (key-kim) | 201, soldBy "김매표" | 같음 |
| 같은 좌석 다시 판매 | 409, SeatUnavailableError | 같음 |
| 직원 키 없이 판매 | 401 | 같음 |
| 포스터 업로드 | 201 | 415 |

라우트 표와 응답 본문은 두 어댑터에서 같다(부팅 로그의 Mapped 줄은 둘 다 23개):

```text
[RouterExplorer] Mapped {/reservations, POST} route
[RouterExplorer] Mapped {/reservations/refund, POST} route
[RouterExplorer] Mapped {/reservations/:id/receipt, GET} route
[NestApplication] Nest application successfully started
```

```text
$ curl -X POST localhost:4030/concerts -H 'content-type: application/json' --data-binary @concert.json
{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}
$ curl localhost:4030/concerts
[{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}]
```

`curl -i localhost:4030/concerts`의 응답 헤더는 다르다. timeout=65는 main.ts의 keepAliveTimeout 65초이고, 그 줄을 지우면 Express 5, Fastify 72가 나온다:

| Express | Fastify |
|---|---|
| X-Powered-By: Express | (없음) |
| Content-Type: application/json; charset=utf-8 | content-type: application/json; charset=utf-8 |
| ETag: W/"3c-jbE9E2vrboUqmMR4G86jkdGKT3Q" | (없음) |
| Keep-Alive: timeout=65 | Keep-Alive: timeout=65 |

같은 `app.listen(4030)`이 듣는 주소(`netstat -ano -p tcp`):

```text
Express
  TCP    0.0.0.0:4030           0.0.0.0:0              LISTENING       <프로세스 번호>
  TCP    [::]:4030              [::]:0                 LISTENING       <프로세스 번호>
```

```text
Fastify
  TCP    127.0.0.1:4030         0.0.0.0:0              LISTENING       <프로세스 번호>
  TCP    [::1]:4030             [::]:0                 LISTENING       <프로세스 번호>
```

같은 PC에서 랜 카드 주소로 불렀을 때:

```text
Express
$ curl http://192.168.45.220:4030/concerts
[{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}]
[200]
```

```text
Fastify
$ curl http://192.168.45.220:4030/concerts
curl: (7) Failed to connect to 192.168.45.220 port 4030 after 2040 ms: Could not connect to server
```

Fastify에서 `app.listen(process.env.PORT ?? 3000, '0.0.0.0')`으로 바꾼 뒤:

```text
  TCP    0.0.0.0:4030           0.0.0.0:0              LISTENING       <프로세스 번호>
$ curl http://192.168.45.220:4030/concerts
[{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}]
[200]
```

제목이 200KB인 공연 등록 본문. Express는 body parser 상한(100KB)에서, Fastify는 상한(1MiB) 안이라 검증 파이프(MaxLength 100)에서 거절한다:

```text
$ curl -X POST localhost:4030/concerts -H 'content-type: application/json' --data-binary @big200k.json
Express  [413] {"type":"about:blank","title":"Payload Too Large","status":413,"detail":"request entity too large","instance":"/concerts"}
Fastify  [400] {"type":"about:blank","title":"Bad Request","status":400,"errors":["title must be shorter than or equal to 100 characters"],"instance":"/concerts"}
```

2MB 본문과 깨진 JSON. 본문 모양은 둘 다 이 프로젝트의 필터가 만든 Problem Details이고 detail 문구만 다르다:

```text
2MB 본문
Express  [413] "detail":"request entity too large"
Fastify  [413] "detail":"Request body is too large"
```

```text
깨진 JSON: -d '{"title":'
Express  [400] "detail":"Unexpected end of JSON input"
Fastify  [400] "detail":"Body is not valid JSON but content-type is set to 'application/json'"
```

`new FastifyAdapter({ bodyLimit: 100 * 1024 })`로 상한을 적은 뒤:

```text
$ curl ... --data-binary @big200k.json
[413] {"type":"about:blank","title":"Payload Too Large","status":413,"detail":"Request body is too large","instance":"/concerts"}
```

처리량. `PAYMENT_MODE=fake FAKE_PG_DELAY_MS=20`(결제마다 20ms 대기)으로 띄우고 공연 하나를 등록한 뒤, 경로마다 5초 예열하고 아래 명령을 세 번 돌렸다. 두 어댑터 모두 고친 코드이고, 부하 도구와 서버가 같은 PC라 절댓값은 비교용이다:

```bash
npx autocannon -c 100 -d 10 localhost:4030/concerts
npx autocannon -c 100 -d 10 -m POST -H content-type=application/json \
  -i rsv-bench.json localhost:4030/reservations
```

공연 목록:

| 어댑터 | 초당 요청 (평균) | 평균 지연 |
|---|---|---|
| Express 1회 | 12,193.6 | 7.71ms |
| Express 2회 | 12,916 | 7.24ms |
| Express 3회 | 12,969.1 | 7.21ms |
| Fastify 1회 | 15,081.1 | 6.13ms |
| Fastify 2회 | 14,181.6 | 6.54ms |
| Fastify 3회 | 13,911.6 | 6.69ms |

결제사를 20ms 기다리는 예매. 회차끼리의 차이가 어댑터 차이보다 크다:

| 어댑터 | 초당 요청 (평균) | 평균 지연 |
|---|---|---|
| Express 1회 | 3,095.8 | 31.94ms |
| Express 2회 | 2,926.4 | 33.76ms |
| Express 3회 | 3,067.2 | 32.18ms |
| Fastify 1회 | 2,659.9 | 37.21ms |
| Fastify 2회 | 3,102 | 31.83ms |
| Fastify 3회 | 3,167.6 | 31.18ms |

### 해 볼 때 참고

- Fastify 설치와 되돌리기: `npm install @nestjs/platform-fastify`, 실험이 끝나면 `npm uninstall @nestjs/platform-fastify`. npm 설정에 다른 운영체제(os)를 지정해 두었다면 `npm install --os=win32 ...`처럼 지금 운영체제를 적어야 네이티브 바이너리가 설치된다
- main.ts를 Fastify로 바꾸는 코드. `app.use(requestId, requestLog)`는 Fastify 어댑터에서 첫 인자를 경로로 읽으므로 `app.use(requestId)`, `app.use(requestLog)` 두 줄로 나눠야 부팅된다

```ts
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.use(requestId, requestLog);
  app.use(compression());
  // ... 전역 ValidationPipe, keepAliveTimeout, enableShutdownHooks
  await app.listen(process.env.PORT ?? 3000);
}
```

- 미들웨어는 Node의 `IncomingMessage`, `ServerResponse`만 쓰게 고친다. 요청 로그는 `req.originalUrl ?? req.url`, `res.on('finish')`, `res.statusCode`, 직원 키 가드는 `req.headers['x-staff-key']`를 읽는다

```ts
import type { IncomingMessage, ServerResponse } from 'node:http';

export function requestId(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const id = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('x-request-id', id);
  next();
}
```

- 예외 필터는 HttpAdapterHost로 응답을 어댑터에 맡긴다. DomainErrorFilter도 같은 방식이다

```ts
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    const req = host.switchToHttp().getRequest();
    const res = host.switchToHttp().getResponse();
    // ... status, body 만들기 (그대로)
    body.instance = httpAdapter.getRequestUrl(req);
    httpAdapter.setHeader(res, 'content-type', 'application/problem+json');
    httpAdapter.reply(res, body, status);
  }
}
```

- 예매 500 재현: 예매 핸들러를 `reserve(@Body() body: CreateReservationDto, @Req() req: Request)`로 받고 `const userAgent = req.get('user-agent') ?? 'unknown';`으로 꺼내면 Fastify에서 `req.get is not a function`이 난다
- 매표소 확인: 공연·회차·좌석을 만든 뒤 `POST /box-office/performances/1/seats/A-1-1/sell`을 `x-staff-key: key-kim`으로 두 번, 키 없이 A-1-2로 한 번. 포스터는 `curl -F file=@poster.png localhost:4030/concerts/1/poster`. Fastify에서 파일 업로드는 multer 대신 Fastify용 multipart 처리가 따로 필요하다
- 듣는 주소는 Windows에서 `netstat -ano -p tcp | grep ":4030 "`, 랜 주소는 `ipconfig`의 IPv4 주소로 확인한다. 컨테이너 안에서 127.0.0.1만 들으면 바깥 요청은 닿지 않는다
- 처리량 실험의 예매 본문은 channel을 email로 해서 문자 큐를 쓰지 않는다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/core·platform-express 12.2.0, @nestjs/platform-fastify 12.2.0 | 2026-10-26 |
| Express·Fastify | express 5.3.0(platform-express가 고정), fastify 5.12.7·@fastify/middie 9.3.5(platform-fastify가 고정) | 2026-10-26 |
| 시연 환경 | Windows, Node v24.11.0, 앱 4030, 가짜 외부 서버 5030 | 2026-10-26 |
| Fastify 미들웨어 | Fastify 래퍼 대신 Node의 raw req, res를 받음. Express에 기대는 레시피는 Fastify용 패키지로 | 2026-10-26 |
| 어댑터와 상관없는 예외 필터 | HttpAdapterHost의 httpAdapter.reply, getRequestUrl | 2026-10-26 |
| Fastify 기본 듣는 주소 | localhost(127.0.0.1, ::1). 다른 호스트에서 받으려면 '0.0.0.0' | 2026-10-26 |
| Fastify 공개 벤치마크 | GET / 에 { hello: 'world' }를 돌려주는 서버, autocannon -c 100 -d 40 -p 10 | 2026-10-26 |
| 본문 기본 상한 | Express(body-parser json) 100KB, Fastify bodyLimit 1MiB | 2026-10-26 |
| Keep-Alive | main.ts keepAliveTimeout 65초면 둘 다 timeout=65. 그 줄을 지우면 Express(Node http) 5, Fastify 72 | 2026-10-26 |
| autocannon | 8.0.0, `-c 100 -d 10`, 5초 예열 뒤 경로마다 세 번 | 2026-10-26 |
| 처리량 실측 | 공연 목록 Express 12,193.6·12,916·12,969.1 / Fastify 15,081.1·14,181.6·13,911.6 (초당 평균), 예매(결제 20ms) Express 3,095.8·2,926.4·3,067.2 / Fastify 2,659.9·3,102·3,167.6 | 2026-10-26 |
| Fastify용 패키지 | 압축 @fastify/compress, 보안 헤더 @fastify/helmet, 파일 업로드 @fastify/multipart | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 보안 헤더(helmet)와 그 Fastify 대응 | 155강, 157강 |
| User-Agent로 매크로 찾기 | 159강 |
| 컨테이너 네트워크와 이미지 | 247강 |
| 부하 테스트 설계와 해석 | 278강 |
| 입력 크기 제한 공격 | 153강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

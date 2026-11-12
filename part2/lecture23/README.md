# 23강. 미들웨어

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 22강](../../part2/lecture22/) | [제2부 목록](../) | [24강 →](../../part2/lecture24/)

## 이번 강의 질문

라우트가 정해지기 전에 모든 요청이 지나는 미들웨어에는 어떤 일을 맡기고, 어떤 일은 맡기면 안 되나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 21강 끝 코드([../../part2/lecture21/code/](../../part2/lecture21/code/)). 22강의 추적 모듈은 넣지 않는다
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 요청 ID와 요청 로그를 함수 미들웨어로 만들어 main.ts에서 body parser보다 먼저 거는 버전이다. 아래 명령은 bash 기준이다
- 서버는 code/ 안의 `.env`를 읽으므로 [20강 실습 자료](../../part2/lecture20/)와 같은 내용으로 만든다

공연 등록 본문은 UTF-8 파일 `concert.json`으로 만들어 보낸다. Windows 셸에서 `-d`로 한글을 넣으면 깨진다.

```json
{"title":"가을 콘서트","venue":"올림픽홀"}
```

```bash
cd code
npm install
npx nest build
PORT=4023 PAYMENT_MODE=fake node dist/apps/ticketing/main.js
```

다른 터미널에서 요청을 보낸다.

```bash
curl -X POST localhost:4023/concerts -H 'content-type: application/json' --data-binary @concert.json
curl -X POST localhost:4023/performances -H 'content-type: application/json' -d '{"concertId":1,"startsAt":"2026-11-20T19:00:00+09:00"}'
curl -X POST localhost:4023/performances/1/seats
curl -i localhost:4023/performances/1/seats
curl -X POST localhost:4023/performances/1/seats/A-9-9/hold
curl localhost:4023/nope
curl -H 'x-request-id: lb-7f3a91' localhost:4023/concerts/1
```

본문 상한을 넘는 요청은 좌석 배치 파일 `layout.json`으로 보낸다. A~H구역, 구역마다 40열 × 20석을 `{ zone, row, no, grade }` 객체 배열로 만든 JSON이다(6,400석, 264,515바이트).

```bash
curl -X POST localhost:4023/concerts -H 'content-type: application/json' --data-binary @layout.json
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/request-id.middleware.ts](code/apps/ticketing/src/common/request-id.middleware.ts) | 요청마다 ID를 정해 요청 헤더와 응답 헤더 `x-request-id`에 싣는다. 앞단이 붙인 ID가 있으면 그대로 쓴다 |
| [code/apps/ticketing/src/common/request-log.middleware.ts](code/apps/ticketing/src/common/request-log.middleware.ts) | 응답이 끝난 뒤(`finish`) 요청 ID, 메서드, 경로, 상태 코드, 걸린 시간을 한 줄로 남긴다 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `app.use(requestId, requestLog)`를 compression보다, body parser보다 먼저 건다 |

### 실행 결과

main.ts에 건 미들웨어의 요청 로그. 공연 등록 201, 본문 상한을 넘은 좌석 배치 요청 500, 없는 주소 404가 모두 남는다(요청 ID는 앞 8자리만 적었다).

```text
LOG [HTTP] 4661e5d9-… POST /concerts 201 7.9ms
LOG [HTTP] ff788da5-… POST /concerts 500 2.5ms
LOG [HTTP] 1aa22630-… GET /nope 404 0.7ms
```

좌석 배치 파일을 보낸 응답과 서버 에러 로그. 본문 파서의 기본 상한 100KB(102,400바이트)를 넘었다.

```text
$ wc -c layout.json
264515 layout.json

$ curl -X POST localhost:4023/concerts --data-binary @layout.json
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.","instance":"/concerts"}

ERROR [ProblemDetails] PayloadTooLargeError: request entity too large
  expected: 264515, length: 264515, limit: 102400
```

Nest 기본 예외 처리라면 `413 {"statusCode":413,"message":"request entity too large"}`가 나간다. 지금의 `ProblemDetailsFilter`는 이 에러가 `HttpException`이 아니라서 모르는 에러(500)로 처리한다.

### 해 볼 때 참고

**클래스 미들웨어로 등록하기.** 같은 일을 `@Injectable()` 클래스로 만들어 AppModule의 `configure`에서 걸 수도 있다. 이렇게 하면 body parser 뒤에 실행되어, 본문 상한에서 실패한 요청은 요청 로그에 남지 않는다.

```ts
@Injectable()
export class RequestLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const started = performance.now();
    res.on('finish', () => {
      const ms = (performance.now() - started).toFixed(1);
      const id = req.headers['x-request-id'];
      this.logger.log(`${id} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
  }
}
```

```ts
@Module({ /* imports, controllers, providers 그대로 */ })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLogMiddleware).forRoutes('*path');
  }
}
```

`RequestIdMiddleware`는 code/의 `requestId` 함수 본문을 `use` 메서드로 옮긴 것이다. 이 상태에서 위 요청을 보낸 로그와 헤더:

```text
LOG [HTTP] deb5e0be-… POST /concerts 201 4.8ms
LOG [HTTP] 3e69d4c7-… POST /performances 201 0.5ms
LOG [HTTP] af68fab5-… POST /performances/1/seats 201 0.9ms
LOG [HTTP] 44995d59-… GET /performances/1/seats 200 0.7ms
LOG [HTTP] 514bc72f-… POST /performances/1/seats/A-9-9/hold 404 1.0ms
LOG [HTTP] 8c5d4098-… GET /nope 404 0.6ms
```

```text
$ curl -i localhost:4023/performances/1/seats
HTTP/1.1 200 OK
x-request-id: 44995d59-6b24-4013-b6b3-01d67d6f66bb

$ curl -H 'x-request-id: lb-7f3a91' localhost:4023/concerts/1
LOG [HTTP] lb-7f3a91 GET /concerts/1 200 0.3ms
```

404 두 줄 중 `A-9-9/hold`는 핸들러가 실행되어 좌석이 없다고 답한 것이고, `/nope`은 라우트가 없어 핸들러가 실행되지 않은 것이다. 둘 다 미들웨어 로그에는 남는다.

**next()를 빠뜨리면.** 요청 로그 미들웨어의 `next();`를 지우고 `curl -m 3 -w ' [%{http_code}] %{time_total}s' localhost:4023/concerts`를 보내면 응답 없이 클라이언트의 대기 시간이 끝나야 실패한다. 서버에는 에러도 요청 로그도 남지 않는다(`finish`가 오지 않는다).

```text
$ curl -m 3 localhost:4023/concerts
 [000] 3.010492s exit=28
```

**비동기 미들웨어의 예외.** 아래 점검 미들웨어를 클래스 미들웨어로 만들어 `apply` 마지막에 더하고 `MAINTENANCE=on`으로 서버를 띄우면, 미들웨어에서 던진 예외를 예외 필터가 받아 503으로 답한다.

```ts
async use(req: Request, res: Response, next: NextFunction) {
  const on = await Promise.resolve(process.env.MAINTENANCE === 'on');
  if (on) throw new ServiceUnavailableException('점검 중입니다');
  next();
}
```

```text
$ curl localhost:4023/concerts
{"type":"about:blank","title":"Service Unavailable","status":503,
 "detail":"점검 중입니다","instance":"/concerts"}
LOG [HTTP] 0b276d10-… GET /concerts 503 1.3ms
```

**본문 상한 바꾸기.** main.ts에서 아래처럼 상한을 올리면 같은 좌석 배치 파일이 등록된다. 상한은 가장 큰 정상 요청에 맞춰 정하고, 큰 파일은 본문 JSON 대신 업로드나 스트리밍으로 받는다. code/는 기본 상한을 그대로 둔다.

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useBodyParser('json', { limit: '1mb' });
```

```text
$ curl -X POST localhost:4023/concerts --data-binary @layout.json
{"id":1,"title":"좌석 배치"}
```

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS·Express | @nestjs/core·platform-express 12.2.0, Express 5.3.0 | 2026-10-26 |
| body parser JSON 기본 상한 | 100KB (limit: 102400) | 2026-10-26 |
| 요청 로그 처리 시간 | 0.3~7.9ms | 2026-10-26 |
| Nest 기본 처리의 413 본문 | {"statusCode":413,"message":"request entity too large"} | 2026-10-26 |
| 좌석 배치 JSON 크기 | 264,515바이트(6,400석) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 핸들러를 아는 곳에서 들여보낼지 정하기 | [24강](../../part2/lecture24/) |
| 상태 코드를 가진 일반 에러를 필터가 읽기(413) | [27강](../../part2/lecture27/) |
| 핸들러별 처리 시간 | [26강](../../part2/lecture26/) |
| 요청 ID를 코드 전체로 전파(AsyncLocalStorage)와 분산 추적 | 266강 |
| 구조화 로그(JSON 로그) | 264강 |
| 큰 파일 업로드와 객체 스토리지 | 300강 |
| 본문 크기를 이용한 공격과 입력 제한 | 153강 |
| Fastify의 본문 처리 | [30강](../../part2/lecture30/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

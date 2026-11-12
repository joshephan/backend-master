# 26강. 인터셉터와 AOP

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 25강](../../part2/lecture25/) | [제2부 목록](../) | [27강 →](../../part2/lecture27/)

## 이번 강의 질문

모든 핸들러 앞뒤에 똑같이 붙어야 하는 일을 핸들러마다 쓰지 않으려면 어디에 두고, 그 자리에서 할 수 있는 것과 없는 것은 무엇인가.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0). Docker는 필요 없다
- 25강 끝 코드([../../part2/lecture25/code/](../../part2/lecture25/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에 `.env` 파일을 만든다. main.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 서버가 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- `code/`에서 `npm install` 뒤 `PORT=4026 PAYMENT_MODE=fake npm run start`로 서버를 띄운다
- 서버를 띄울 때마다 공연·회차·좌석을 먼저 만든다. concert.json은 UTF-8 파일로 만들어 보낸다(Windows 셸에서 `-d`로 한글을 넣으면 깨진다)

```bash
node -e "require('fs').writeFileSync('concert.json', JSON.stringify({title:'가을 콘서트',venue:'올림픽홀'}))"
curl -X POST localhost:4026/concerts -H 'content-type: application/json' --data-binary @concert.json
curl -X POST localhost:4026/performances -H 'content-type: application/json' -d '{"concertId":1,"startsAt":"2026-11-20T19:00:00+09:00"}'
curl -X POST localhost:4026/performances/1/seats
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/timing.interceptor.ts](code/apps/ticketing/src/common/timing.interceptor.ts) | TimingInterceptor. 요청 ID, 컨트롤러·핸들러 이름, 상태 코드나 실패한 예외 이름, 처리 시간을 한 줄로 남긴다. `tap({ next, error })`로 실패한 요청도 기록 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | providers에 `{ provide: APP_INTERCEPTOR, useClass: TimingInterceptor }` 추가 |

### 실행 결과

TimingInterceptor를 붙이고 보낸 요청들:

```bash
curl "localhost:4026/performances/1/seats?row=3"
curl -X POST localhost:4026/performances/1/seats/A-1-1/hold   # 두 번 보내면 두 번째는 409
curl -X POST localhost:4026/box-office/performances/1/seats/A-1-2/sell   # 401
curl "localhost:4026/performances/1/seats?row=abc"   # 400
```

서버 로그. 같은 요청 ID로 핸들러 시간(Timing)과 요청 전체 시간(HTTP)이 한 줄씩 남는다:

```text
[Timing] 75d55345-… SeatsController.findAll 200 0.4ms
[HTTP]   75d55345-… GET /performances/1/seats?row=3 200 1.2ms
[Timing] 8dbf3dd9-… SeatsController.hold 201 0.2ms
[HTTP]   8dbf3dd9-… POST /performances/1/seats/A-1-1/hold 201 0.8ms
[Timing] 9e0560f2-… SeatsController.hold 실패(ConflictException) 0.4ms
[HTTP]   9e0560f2-… POST /performances/1/seats/A-1-1/hold 409 0.9ms
[Timing] 19a9809f-… ReservationsController.reserve 201 0.8ms
[HTTP]   19a9809f-… POST /reservations 201 1.7ms
```

가드가 막은 401은 Timing 줄이 없고, 파이프가 막은 400은 Timing 줄이 있다(인터셉터가 파이프를 감싼다):

```text
[HTTP]   91a42185-… POST /box-office/performances/1/seats/A-1-2/sell 401 15.4ms

[Timing] 442ac26e-… SeatsController.findAll 실패(BadRequestException) 0.7ms
[HTTP]   442ac26e-… GET /performances/1/seats?row=abc 400 1.1ms
```

응답을 `{ data }`로 감싸는 인터셉터를 좌석 목록 핸들러에 붙였을 때. 성공 응답만 감싸지고 400은 그대로다:

```text
$ curl "localhost:4026/performances/1/seats?row=1&status=HELD"
{"data":[{"id":"A-1-1","label":"A구역 1열 1번","status":"HELD"}]}
$ curl "localhost:4026/performances/1/seats?row=abc"
{"type":"about:blank","title":"Bad Request","status":400,"errors":[…], …}
```

3초 동안 응답을 기억하는 인터셉터를 붙였을 때. 기억한 동안에는 핸들러가 돌지 않아 새로 붙잡힌 좌석이 보이지 않는다:

```text
POST …/seats/A-1-1/hold
GET  …/seats?row=1&status=HELD  → A-1-1 (좌석 목록 핸들러 실행)
POST …/seats/A-1-2/hold
GET  …/seats?row=1&status=HELD  → A-1-1 만  (캐시 응답, 핸들러 실행 없음)
(3초 뒤)
GET  …/seats?row=1&status=HELD  → A-1-1, A-1-2 (좌석 목록 핸들러 실행)
```

2초 타임아웃 인터셉터를 ReservationsController에 붙이고 `FAKE_PG_DELAY_MS=5000`(가짜 결제사가 5초 걸림)으로 예매 요청을 보냈을 때. 고객 앱은 2초에 504를 받지만 서버 안의 결제는 5초쯤에 끝난다. 시각은 UTC이고, 예매 로그 앞에 시각을 붙여서 찍었다:

```text
06:11:57.389 요청 보냄
{"type":"about:blank","title":"Gateway Timeout","status":504,
 "detail":"처리 시간이 2초를 넘었습니다", …} [504] 2.009693s
06:11:59.485 응답 받음

[Timing] 8a6f6579-… ReservationsController.reserve 실패(GatewayTimeoutException) 2006.7ms
[HTTP]   8a6f6579-… POST /reservations 504 2008.4ms
06:12:02.455 [예매] A-1-1 결제 완료
```

### 해 볼 때 참고

아래 세 인터셉터는 실험용이라 [code/](code/)에 없다. 직접 만들어 붙여 보고 지운다.

- 응답 감싸기: `common/wrap.interceptor.ts`에 아래 클래스를 두고, 좌석 목록 핸들러에 `@UseInterceptors(WrapInterceptor)`를 붙인다

```ts
@Injectable()
export class WrapInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
```

- 핸들러 건너뛰기: `common/seat-map-cache.interceptor.ts`에 주소별 `{ at, body }`를 담는 Map 필드 `cache`와 Logger를 두고 `intercept`를 아래처럼 쓴다. 좌석 목록 핸들러에 `@UseInterceptors(WrapInterceptor, SeatMapCacheInterceptor)`와 `console.log('좌석 목록 핸들러 실행')`을 넣으면 핸들러가 돌았는지 로그로 보인다

```ts
intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
  const key = context.switchToHttp().getRequest<Request>().originalUrl;
  const hit = this.cache.get(key);
  if (hit && Date.now() - hit.at < 3000) {
    this.logger.log(`캐시 응답 ${key}`);
    return of(hit.body);              // next.handle()을 부르지 않음
  }
  return next.handle().pipe(tap((body) => this.cache.set(key, { at: Date.now(), body })));
}
```

- 타임아웃: `common/timeout.interceptor.ts`에 아래 클래스를 두고 ReservationsController에 `@UseInterceptors(TimeoutInterceptor)`를 붙인다. `FAKE_PG_DELAY_MS=5000`을 더해 서버를 띄우고 예매를 보낸다. 결제 완료 시각을 보려면 TaggedLogger 출력 앞에 `new Date().toISOString().slice(11, 23)`을 붙인다

```ts
// 2초 안에 끝나지 않으면 504
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(2000),
      catchError((err) =>
        throwError(() => (err instanceof TimeoutError ? new GatewayTimeoutException('처리 시간이 2초를 넘었습니다') : err)),
      ),
    );
  }
}
```

```bash
curl -X POST localhost:4026/reservations -H 'content-type: application/json' -d '{"seatId":"A-1-1","amount":110000,"buyer":"010-1234-5678"}'
```

- `timeout`은 응답 쪽 구독을 끊을 뿐, 핸들러가 이미 시작한 Promise(결제사 호출, 예매 저장)는 멈추지 않는다. 504를 받은 고객 앱이 다시 결제하면 두 번 결제된다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| rxjs | 7.8.x (package.json ^7.8.1) | 2026-10-26 |
| NestJS | @nestjs/common·core 12.2.0 | 2026-10-26 |
| Timing·HTTP 로그 시간 | 0.2~1.7ms | 2026-10-26 |
| 타임아웃 시연 | 504 2.009693s, 결제 완료 요청 뒤 약 5.07초 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| ClassSerializerInterceptor로 응답 필드 감추기 | [28강](../../part2/lecture28/) |
| 예외를 응답으로 바꾸는 규칙 | [27강](../../part2/lecture27/) |
| 캐시 인터셉터와 캐시 무효화 | 122~124강 |
| 외부 호출의 타임아웃과 취소(AbortSignal) | 210강 |
| 재시도와 멱등성 키, 이중 결제 막기 | 211강, 214강 |
| 응답 래핑과 API 응답 규격 | 49강 |
| 트랜잭션 경계를 인터셉터로 | 74강 |
| 메트릭으로 처리 시간 모으기 | 265강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

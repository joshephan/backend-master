# 19강. 인젝션 스코프

제2부 NestJS 핵심 · 5장 의존성 주입

[← 18강](../../part2/lecture18/) | [제2부 목록](../) | [20강 →](../../part2/lecture20/)

## 이번 강의 질문

앱 전체에 하나뿐인 서비스에 요청마다 다른 값을 넣으면 무슨 일이 생기고, 객체를 요청마다·쓰는 곳마다 따로 만들려면 무엇을 정해야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 18강 끝 코드([../../part2/lecture18/code/](../../part2/lecture18/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 구매자를 인자로 넘기는 예매 서비스(DEFAULT 스코프)와 `TRANSIENT` 스코프 `TaggedLogger`가 들어 있다. 아래 명령은 bash 기준이다

거의 동시에 들어온 두 예매를 보내는 스크립트를 code/ 밖에 `race.mjs`로 저장한다. 한글 이름이 깨지지 않게 Node `fetch`로 보낸다.

```js
const port = process.argv[2];
const send = (body) =>
  fetch(`http://localhost:${port}/reservations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.text());
const a = send({ seatId: 'A-3-15', amount: 110000, buyer: '김민수' });
await new Promise((r) => setTimeout(r, 50));
const b = send({ seatId: 'B-7-2', amount: 99000, buyer: '이지은' });
console.log(await a);
console.log(await b);
```

가짜 결제사가 0.2초 늦게 답하게 하고(`FAKE_PG_DELAY_MS=200`) 서버를 띄운 뒤 두 예매를 보낸다.

```bash
cd code
npm install
npx nest build
PORT=4019 PAYMENT_MODE=fake FAKE_PG_DELAY_MS=200 node dist/apps/ticketing/main.js &
node ../race.mjs 4019
curl -s -X POST localhost:4019/reservations/refund -H 'content-type: application/json' -d '{"approvalId":"fake-110000"}'
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/logging/tagged-logger.ts](code/apps/ticketing/src/logging/tagged-logger.ts) | 태그를 붙여 찍는 로거. `Scope.TRANSIENT`라 주입받는 곳마다 하나씩 생긴다 |
| [code/apps/ticketing/src/reservations/reservations.service.ts](code/apps/ticketing/src/reservations/reservations.service.ts) | 구매자를 필드에 두지 않고 인자로 받아 `notifyTo`로 돌려준다. 로거 태그는 `예매` |
| [code/apps/ticketing/src/reservations/refunds.service.ts](code/apps/ticketing/src/reservations/refunds.service.ts) | 로거를 받아 태그 `환불`로 환불 로그를 찍는다 |
| [code/apps/ticketing/src/reservations/reservations.controller.ts](code/apps/ticketing/src/reservations/reservations.controller.ts) | 예매 본문에 `buyer`를 받아 서비스에 넘긴다 |
| [code/apps/ticketing/src/reservations/reservations.module.ts](code/apps/ticketing/src/reservations/reservations.module.ts) | providers에 `TaggedLogger` 추가 |
| [code/apps/ticketing/src/payments/fake-payment-gateway.ts](code/apps/ticketing/src/payments/fake-payment-gateway.ts) | `FAKE_PG_DELAY_MS`만큼 기다린 뒤 답하는 지연 추가 |

### 실행 결과

`node race.mjs 4019`의 출력. 구매자를 인자로 넘기므로 두 예매의 `notifyTo`가 각자의 구매자다.

```text
{"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"notifyTo":"김민수"}
{"seatId":"B-7-2","approvalId":"fake-99000","amount":99000,"notifyTo":"이지은"}
```

서버 로그. 로거는 부팅 때 예매 서비스용과 환불 서비스용 두 개가 생기고, 태그가 섞이지 않는다.

```text
TaggedLogger #1 생성
TaggedLogger #2 생성
FakePaymentGateway #1 생성
...
[예매] A-3-15 결제 완료
[예매] B-7-2 결제 완료
[환불] fake-110000 환불
```

### 해 볼 때 참고

나쁜 예는 하나씩 바꿔 보고 확인한 뒤 되돌린다.

**필드에 넣은 구매자.** 예매 서비스에 `private buyer: string` 필드를 두고 `reserve`에서 `this.buyer = buyer`로 넣은 뒤, 결제를 기다리고 나서 `notifyTo: this.buyer`로 읽게 바꾼다. 서비스는 앱에 하나라서 0.05초 뒤 들어온 요청이 필드를 덮어쓴다. 에러는 나지 않고, 요청을 하나씩 보내면 정상이다.

```ts
@Injectable()
export class ReservationsService {
  private buyer: string;

  constructor(private readonly gateway: PaymentGateway) {
    console.log('ReservationsService 생성');
  }

  async reserve(seatId: string, amount: number, buyer: string) {
    this.buyer = buyer;
    const payment = await this.gateway.charge(amount);
    return { seatId, ...payment, notifyTo: this.buyer };
  }
}
```

```text
$ node race.mjs 4019
{"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"notifyTo":"이지은"}
{"seatId":"B-7-2","approvalId":"fake-99000","amount":99000,"notifyTo":"이지은"}
```

**Scope.REQUEST.** 위 필드 코드는 그대로 두고 `@Injectable({ scope: Scope.REQUEST })`로 바꾸면 두 구매자가 제대로 돌아온다. 대신 예매 서비스와 그것을 받는 컨트롤러가 요청마다 새로 생긴다.

```text
$ node race.mjs 4019
{"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"notifyTo":"김민수"}
{"seatId":"B-7-2","approvalId":"fake-99000","amount":99000,"notifyTo":"이지은"}
```

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
FakePaymentGateway #1 생성
SeatsService 생성
RefundsService 생성
LOG [NestApplication] Nest application successfully started
ReservationsService 생성
ReservationsController 생성
ReservationsService 생성
ReservationsController 생성
```

컨트롤러 생성 로그는 `ReservationsController` 생성자에 `console.log('ReservationsController 생성')`을 더해야 보인다. 예매 서비스를 쓰지 않는 환불 요청에도 컨트롤러와 예매 서비스가 생긴다.

```text
$ curl -X POST localhost:4019/reservations/refund -d '{"approvalId":"fake-110000"}'
{"refunded":"fake-110000"}

ReservationsService 생성
ReservationsController 생성
```

**처리량 비교.** DEFAULT와 REQUEST의 초당 처리 수는 시효성 데이터 표에 있다. 생성 로그를 지운 빌드로, 측정 전 3천 요청으로 데운 뒤 동시 100개로 3만 요청을 보내 쟀다(`node bench.mjs 4019 30000 100`). 측정 도구와 서버를 같은 PC에서 함께 돌렸고, 두 스코프의 차이는 측정 흔들림보다 작았다.

```js
// bench.mjs
const [port, total = 20000, conc = 100] = process.argv.slice(2).map(Number);
const body = JSON.stringify({ seatId: 'A-3-15', amount: 110000, buyer: 'kim' });
let sent = 0;
const worker = async () => {
  while (sent < total) {
    sent++;
    const r = await fetch(`http://localhost:${port}/reservations`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body,
    });
    await r.text();
  }
};
const t = performance.now();
await Promise.all(Array.from({ length: conc }, worker));
const sec = (performance.now() - t) / 1000;
console.log(`${total}개 ${sec.toFixed(2)}초, 초당 ${Math.round(total / sec)}개`);
```

**공용 로거의 태그.** tagged-logger.ts에서 `{ scope: Scope.TRANSIENT }`를 빼 기본 스코프로 두면 로거가 앱에 하나만 생기고, 마지막 `setTag('환불')`이 예매 로그까지 덮는다.

```text
[환불] A-3-15 결제 완료
[환불] B-7-2 결제 완료
[환불] fake-110000 환불
```

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0 | 2026-10-26 |
| 공식 문서 문장 | 스코프 정의 세 줄, "The REQUEST scope bubbles up the injection chain.", "Transient-scoped dependencies don't follow that pattern.", "Request-scoped providers affect application performance.", "Unless a provider must be request-scoped, we strongly recommend using the default singleton scope.", "Some providers must act as singletons and should not use request-scoped providers"(Passport 전략, Cron 컨트롤러) | 2026-10-26 |
| 처리량 측정 | DEFAULT 초당 7,245 / 6,660 / 5,657 / 6,213 / 6,534, REQUEST 초당 6,892 / 6,319 / 7,681 / 4,823 / 7,022 (번갈아 5회) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 요청 객체를 쓰는 가드와 실행 컨텍스트 | [24강](../../part2/lecture24/) |
| 좌석 붙잡기의 동시성 | 83강 |
| 서버 여러 대와 프로세스 메모리 | 281강 |
| 요청 컨텍스트 전파(AsyncLocalStorage, 추적 ID) | 266강 |
| 테넌트별 durable 프로바이더 | 314강 |
| Nest 내장 Logger와 구조화 로깅 | 263강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

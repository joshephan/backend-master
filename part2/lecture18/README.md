# 18강. 커스텀 프로바이더와 인젝션 토큰

제2부 NestJS 핵심 · 5장 의존성 주입

[← 17강](../../part2/lecture17/) | [제2부 목록](../) | [19강 →](../../part2/lecture19/)

## 이번 강의 질문

쓰는 쪽 코드는 그대로 두고, 들어가는 객체만 환경에 따라 바꾸려면 Nest에 무엇을 어떻게 알려 줘야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node.js 24(전역 `fetch`와 `AbortSignal.timeout`을 쓴다). Docker는 필요 없다
- 시작 상태: 17강 끝 코드([../../part2/lecture17/code/](../../part2/lecture17/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 결제사를 `useFactory`로 만들고(토큰 요청에 시간 제한 포함), 환불 서비스는 `useExisting` 별칭 `'LEGACY_PAYMENT'`로 받는 버전이다. 아래 명령은 bash 기준이다

`PAYMENT_MODE=fake`가 아니면 서버는 부팅 중에 결제사 `/token`을 부른다. 이때 쓸 가짜 결제사 서버를 code/ 밖에 `fake-pg.mjs`로 저장한다. `MODE=hang`이면 아무 응답도 하지 않는다.

```js
// 가짜 결제사 서버. MODE=hang이면 응답하지 않는다
import http from 'node:http';
const mode = process.env.MODE ?? 'ok';
http.createServer((req, res) => {
  if (mode === 'hang') return; // 아무 답도 하지 않음
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/token') return res.end(JSON.stringify({ accessToken: 'tok-123' }));
    const { amount } = JSON.parse(body || '{}');
    res.end(JSON.stringify({ approvalId: `pg-${amount}` }));
  });
}).listen(Number(process.env.PORT ?? 5018));
```

```bash
PORT=5018 node fake-pg.mjs &
cd code
npm install
npx nest build
PAYMENT_MODE=http PORT=4018 node dist/apps/ticketing/main.js   # 가짜 결제사 없이 보려면 PAYMENT_MODE=fake
curl -s -X POST localhost:4018/reservations -H 'content-type: application/json' -d '{"seatId":"A-3-15","amount":110000}'
```

결제사 주소와 시간 제한은 payments.module.ts의 `PAYMENT_OPTIONS`(`http://localhost:5018`, 3000ms)에 들어 있다.

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/payments/payment-gateway.ts](code/apps/ticketing/src/payments/payment-gateway.ts) | 인젝션 토큰으로 쓰는 추상 클래스 `PaymentGateway`와 `Payment` 타입 |
| [code/apps/ticketing/src/payments/fake-payment-gateway.ts](code/apps/ticketing/src/payments/fake-payment-gateway.ts) | 가짜 결제사. 생성 번호를 찍고 `fake-<금액>` 승인 번호를 돌려준다 |
| [code/apps/ticketing/src/payments/http-payment-gateway.ts](code/apps/ticketing/src/payments/http-payment-gateway.ts) | 결제사를 HTTP로 부르는 구현. 설정과 접속 토큰을 생성자로 받고, 호출마다 시간 제한을 건다 |
| [code/apps/ticketing/src/payments/payment-options.ts](code/apps/ticketing/src/payments/payment-options.ts) | 심벌 토큰 `PAYMENT_OPTIONS`와 설정 타입 |
| [code/apps/ticketing/src/payments/payments.module.ts](code/apps/ticketing/src/payments/payments.module.ts) | `useValue`(설정), `useFactory`(토큰을 받아 결제사 생성), `useExisting`(`'LEGACY_PAYMENT'` 별칭) 등록 |
| [code/apps/ticketing/src/reservations/refunds.service.ts](code/apps/ticketing/src/reservations/refunds.service.ts) | `@Inject('LEGACY_PAYMENT')`로 결제사를 받는 환불 서비스 |

### 실행 결과

`PAYMENT_MODE=http`로 띄운 부팅 로그. 결제 모듈과 예매 모듈은 결제사 토큰 응답을 기다린 뒤 맨 뒤에 준비된다.

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
SeatsService 생성
LOG [InstanceLoader] AppModule dependencies initialized
LOG [InstanceLoader] ConcertsModule dependencies initialized
LOG [InstanceLoader] PerformancesModule dependencies initialized
LOG [InstanceLoader] SeatsModule dependencies initialized
HttpPaymentGateway 생성: 토큰 tok-123
ReservationsService 생성
RefundsService 생성
LOG [InstanceLoader] PaymentsModule dependencies initialized
LOG [InstanceLoader] ReservationsModule dependencies initialized
LOG [NestApplication] Nest application successfully started
```

`PAYMENT_MODE=fake`로 띄운 생성 로그. 별칭이 `useExisting`이라 예매와 환불이 같은 객체 하나를 받는다.

```text
FakePaymentGateway #1 생성
ReservationsService 생성
RefundsService 생성
```

가짜 결제사를 `MODE=hang PORT=5018 node fake-pg.mjs`로 띄우고 서버를 실행한 결과. 3초 시간 제한이 지나면 에러와 함께 종료한다.

```text
LOG [InstanceLoader] SeatsModule dependencies initialized   (오후 2:12:19)
ERROR [ExceptionHandler] DOMException [TimeoutError]: The operation was aborted due to timeout   (오후 2:12:22)
exit 1
```

### 해 볼 때 참고

나쁜 예는 하나씩 바꿔 보고 확인한 뒤 되돌린다.

**인터페이스로 받기.** 결제사를 인터페이스 `PaymentPort`로 선언하고 `import type`으로 가져와 생성자 타입으로 쓰면, 빌드 결과의 타입 목록에 `Object`가 남고 부팅이 멈춘다. 인터페이스는 빌드 후 사라져 토큰이 될 수 없다.

```ts
// payments/payment-port.ts
export interface PaymentPort {
  charge(amount: number): Promise<{ approvalId: string; amount: number }>;
}

// reservations/reservations.service.ts
import type { PaymentPort } from '../payments/payment-port.js';

@Injectable()
export class ReservationsService {
  constructor(private readonly gateway: PaymentPort) {}
```

```text
ERROR [ExceptionHandler] UnknownDependenciesException [Error]: Nest can't resolve dependencies of the ReservationsService (?). Please make sure that the argument at index [0] is available in the current module.
```

**useClass로 고르기.** 팩토리 대신 아래처럼 등록하면 같은 서비스 코드에 환경마다 다른 결제사가 들어간다. 이때 `HttpPaymentGateway`는 `@Injectable()`을 붙이고 생성자에서 `@Inject(PAYMENT_OPTIONS) private readonly options: PaymentOptions`만 받는다(로그는 `HttpPaymentGateway 생성: ${options.baseUrl}`).

```ts
{
  provide: PaymentGateway,
  useClass:
    process.env.PAYMENT_MODE === 'fake' ? FakePaymentGateway : HttpPaymentGateway,
},
```

```text
$ PAYMENT_MODE=fake node dist/apps/ticketing/main.js
FakePaymentGateway #1 생성
ReservationsService 생성
RefundsService 생성
{"seatId":"A-3-15","approvalId":"fake-110000","amount":110000}

$ PAYMENT_MODE=http node dist/apps/ticketing/main.js
HttpPaymentGateway 생성: http://localhost:5018
ReservationsService 생성
RefundsService 생성
{"seatId":"A-3-15","approvalId":"pg-110000","amount":110000}
```

**시간 제한 없는 팩토리.** 팩토리의 토큰 요청에서 `signal: AbortSignal.timeout(options.timeoutMs)`를 빼고 `MODE=hang`으로 띄운 가짜 결제사에 붙이면, 서버는 에러도 종료도 없이 부팅 중에 멈춰 있고 포트는 열리지 않는다.

```text
$ MODE=hang node fake-pg.mjs &
$ PORT=4018 node dist/apps/ticketing/main.js
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
SeatsService 생성
LOG [InstanceLoader] AppModule dependencies initialized
LOG [InstanceLoader] ConcertsModule dependencies initialized
LOG [InstanceLoader] PerformancesModule dependencies initialized
LOG [InstanceLoader] SeatsModule dependencies initialized
(20초 동안 다음 줄 없음)

$ curl localhost:4018/
curl exit 7 (연결 거부)
```

**useClass 별칭.** `{ provide: 'LEGACY_PAYMENT', useExisting: PaymentGateway }`를 `{ provide: 'LEGACY_PAYMENT', useClass: FakePaymentGateway }`로 바꾸고 `PAYMENT_MODE=fake`로 띄우면 객체가 둘 생긴다. 예매는 #1, 환불은 #2를 받는다.

```text
FakePaymentGateway #1 생성
FakePaymentGateway #2 생성
RefundsService 생성
ReservationsService 생성
```

**문자열 토큰 오타.** refunds.service.ts의 `@Inject('LEGACY_PAYMENT')`를 `'LEGACY_PAYMENTS'`로 바꾸면 tsc는 통과하고(exit 0) 부팅에서 실패한다.

```text
ERROR [ExceptionHandler] UnknownDependenciesException [Error]: Nest can't resolve dependencies of the RefundsService (?). Please make sure that the argument "LEGACY_PAYMENTS" at index [0] is available in the ReservationsModule module.
```

**심벌 상수 오타.** payments.module.ts의 `inject: [PAYMENT_OPTIONS]`를 `inject: [PAYMENT_OPTION]`으로 바꾸면 `npx tsc --noEmit -p apps/ticketing/tsconfig.app.json`이 바로 잡는다.

```text
apps/ticketing/src/payments/payments.module.ts(15,16): error TS2552: Cannot find name 'PAYMENT_OPTION'. Did you mean 'PAYMENT_OPTIONS'?
```

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0 | 2026-10-26 |
| Node | v24.11.0, 전역 fetch와 AbortSignal.timeout 사용 | 2026-10-26 |
| 무응답 결제사 부팅 정지 | 20초 동안 SeatsModule 줄 뒤 출력 없음, curl exit 7 | 2026-10-26 |
| 시간 제한 뒤 종료 | timeoutMs 3000, 마지막 정상 로그 2:12:19 → TimeoutError 2:12:22, 프로세스 전체 3,633ms, exit 1 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 결제사 주소를 환경마다 밖에서 받는 모듈 | [20강](../../part2/lecture20/) |
| 테스트 모듈에서 프로바이더 바꿔 끼우기 | [33강](../../part2/lecture33/) |
| 결제 수단 고르기(전략 패턴) | 36강 |
| 결제사 호출의 타임아웃 설계와 재시도 | 210강, 211강 |
| 헬스 체크와 기동 프로브 | 251강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

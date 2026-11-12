# 20강. 동적 모듈과 글로벌 모듈

제2부 NestJS 핵심 · 5장 의존성 주입

[← 19강](../../part2/lecture19/) | [제2부 목록](../) | [21강 →](../../part2/lecture21/)

## 이번 강의 질문

같은 결제 모듈을 환경마다 다른 설정으로 끼우려면 모듈이 설정을 어떻게 받아야 하고, 설정은 언제 읽어야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node.js 24(`process.loadEnvFile()`을 쓴다). Docker는 필요 없다
- 시작 상태: 19강 끝 코드([../../part2/lecture19/code/](../../part2/lecture19/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 결제 모듈을 루트에서 `PaymentsModule.forRootAsync`로 한 번 등록하는 버전이다. 아래 명령은 bash 기준이다
- 가짜 결제사 서버 `fake-pg.mjs`는 [18강 실습 자료](../../part2/lecture18/), 두 예매를 보내는 `race.mjs`는 [19강 실습 자료](../../part2/lecture19/)의 것을 code/ 밖에 둔다

서버는 시작할 때 현재 폴더의 `.env`를 읽는다. 파일이 없으면 시작하지 못하므로 code/ 안에 만든다.

```text
# .env
PG_URL=http://localhost:5020
PG_TIMEOUT_MS=3000
```

```bash
PORT=5020 node fake-pg.mjs &
cd code
npm install
npx nest build
PORT=4020 node dist/apps/ticketing/main.js
node ../race.mjs 4020
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/payments/payments.module.ts](code/apps/ticketing/src/payments/payments.module.ts) | 결제사 팩토리를 `gatewayProvider` 상수로 빼고, `forRoot`(설정 값을 받음)와 `forRootAsync`(설정을 만드는 함수를 받음)가 `global: true`인 동적 모듈을 돌려준다 |
| [code/apps/ticketing/src/payments/payment-options.ts](code/apps/ticketing/src/payments/payment-options.ts) | 설정에 `mode: 'fake' \| 'http'` 추가, `baseUrl`은 선택 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | 루트 imports에 `PaymentsModule.forRootAsync`. 팩토리 안에서 `PAYMENT_MODE`, `PG_URL`, `PG_TIMEOUT_MS`를 읽는다 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `process.loadEnvFile()`로 `.env`를 읽는다 |
| [code/apps/ticketing/src/reservations/reservations.module.ts](code/apps/ticketing/src/reservations/reservations.module.ts) | imports에서 `PaymentsModule` 삭제. 글로벌 모듈로 결제사를 받는다 |

### 실행 결과

서버 부팅 로그와 `node race.mjs 4020`의 출력. `.env`의 결제사 주소가 설정에 들어가고, 예매는 가짜 결제사 서버의 승인 번호를 받는다.

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
결제 설정: {"mode":"http","baseUrl":"http://localhost:5020","timeoutMs":3000}
TaggedLogger #1 생성
TaggedLogger #2 생성
SeatsService 생성
HttpPaymentGateway 생성: 토큰 tok-123
LOG [NestApplication] Nest application successfully started

{"seatId":"A-3-15","approvalId":"pg-110000","amount":110000,"notifyTo":"김민수"}
{"seatId":"B-7-2","approvalId":"pg-99000","amount":99000,"notifyTo":"이지은"}
```

### 해 볼 때 참고

나쁜 예는 하나씩 바꿔 보고 확인한 뒤 되돌린다.

**forRoot로 쓰면 .env 값이 빠진다.** app.module.ts의 `forRootAsync({ useFactory: () => ({ ... }) })`를 `forRoot({ ... })`로 바꾸고 같은 값을 직접 넘기면, `.env`에 값이 있는데도 결제사 주소가 `undefined`가 된다. `main.ts`가 `app.module.ts`를 import하는 순간 `@Module` 데코레이터가 먼저 실행되어 `process.env.PG_URL`을 읽고, `process.loadEnvFile()`은 그 뒤에 실행되기 때문이다. `timeoutMs` 3000도 `.env` 값이 아니라 코드의 기본값이다.

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
결제 설정: {"mode":"http","timeoutMs":3000}
TaggedLogger #1 생성
TaggedLogger #2 생성
SeatsService 생성
ERROR [ExceptionHandler] TypeError: Failed to parse URL from undefined/token
  [cause]: TypeError: Invalid URL
    code: 'ERR_INVALID_URL',
    input: 'undefined/token'
```

**글로벌 끄기.** payments.module.ts `forRootAsync`의 `global: true`를 `false`로 바꾸고 `PAYMENT_MODE=fake`로 띄우면, imports에 결제 모듈이 없는 예매 모듈이 결제사를 찾지 못한다.

```text
ERROR [ExceptionHandler] UnknownDependenciesException [Error]: Nest can't resolve dependencies of the ReservationsService (?, TaggedLogger). Please make sure that the argument PaymentGateway at index [0] is available in the ReservationsModule module.
```

**두 번 등록.** 예매 모듈 imports에 `PaymentsModule.forRoot({ mode: 'fake', timeoutMs: 1000 })`를 넣고 같은 순서로 띄운다. 설정이 다른 결제 모듈이 둘 생기고, 예매 모듈은 자기 imports의 가짜 결제사를 먼저 쓴다. 에러 없이 부팅되지만 http 설정으로 띄운 서버에서 예매가 가짜 승인을 받는다. 확인 뒤 지운다.

```ts
@Module({
  imports: [PaymentsModule.forRoot({ mode: 'fake', timeoutMs: 1000 })],
  controllers: [ReservationsController],
  providers: [ReservationsService, RefundsService, TaggedLogger],
})
export class ReservationsModule {}
```

```text
결제 설정: {"mode":"http","baseUrl":"http://localhost:5020","timeoutMs":3000}
결제 설정: {"mode":"fake","timeoutMs":1000}
FakePaymentGateway #1 생성
HttpPaymentGateway 생성: 토큰 tok-123
LOG [NestApplication] Nest application successfully started

{"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"notifyTo":"김민수"}
{"seatId":"B-7-2","approvalId":"fake-99000","amount":99000,"notifyTo":"이지은"}
```

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0 | 2026-10-26 |
| process.loadEnvFile | Node 내장(v24.11.0에서 사용) | 2026-10-26 |
| 공식 패키지의 이름 관례 예 | TypeOrmModule.forRoot / forFeature, JwtModule.register | 2026-10-26 |
| 공식 문서 문장(모듈) | "Register global modules only once, typically in the root or core module." / "Making everything global is not a recommended design practice." / "Calling `forRoot()` again in another module would create a second, separately configured instance." | 2026-10-26 |
| ConfigurableModuleBuilder | @nestjs/common에 포함, forRoot·forRootAsync 같은 정적 메서드를 만들어 주는 도구 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| @nestjs/config, 설정 검증, 12-Factor | 244강 |
| 시크릿 관리(결제사 비밀 키 보관) | 245강 |
| ConfigurableModuleBuilder로 동적 모듈 만들기 | 244강 |
| 테스트에서 결제 모듈 바꿔 끼우기 | [33강](../../part2/lecture33/) |
| 순환 의존과 모듈 참조 | [21강](../../part2/lecture21/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

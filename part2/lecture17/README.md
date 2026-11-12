# 17강. 의존성 주입과 제어의 역전

제2부 NestJS 핵심 · 5장 의존성 주입

[← 16강](../../part2/lecture16/) | [제2부 목록](../) | [18강 →](../../part2/lecture18/)

## 이번 강의 질문

서비스가 쓸 객체를 자기가 만들지 않고 받기만 하면 무엇이 달라지고, Nest는 무엇을 보고 그 객체를 골라 넣나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node.js 24(실행 결과는 v24.11.0에서 찍었다). Docker는 필요 없다
- 시작 상태: 16강 끝 코드([../../part2/lecture16/code/](../../part2/lecture16/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 결제사 객체를 생성자로 받는 버전이다. 아래 명령은 bash 기준이다

```bash
cd code
npm install
npx nest build && PORT=4017 node dist/apps/ticketing/main.js
```

다른 터미널에서 예매 요청을 세 번 보낸다.

```bash
for i in 1 2 3; do curl -s -X POST localhost:4017/reservations -H 'content-type: application/json' -d "{\"seatId\":\"A-3-1$i\",\"amount\":110000}"; echo; done
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/payments/payment-gateway.ts](code/apps/ticketing/src/payments/payment-gateway.ts) | 가짜 결제사 `PaymentGateway`. 객체가 생길 때마다 번호를 올리고 생성 로그를 찍는다. 승인 번호에 객체 번호가 들어간다 |
| [code/apps/ticketing/src/payments/payments.module.ts](code/apps/ticketing/src/payments/payments.module.ts) | `PaymentGateway`를 등록하고 내보내는 `PaymentsModule` |
| [code/apps/ticketing/src/reservations/reservations.service.ts](code/apps/ticketing/src/reservations/reservations.service.ts) | 예매 서비스. 결제사를 생성자로 받는다 |
| [code/apps/ticketing/src/reservations/refunds.service.ts](code/apps/ticketing/src/reservations/refunds.service.ts) | 환불 서비스. 결제사를 생성자로 받는다 |
| [code/apps/ticketing/src/reservations/reservations.controller.ts](code/apps/ticketing/src/reservations/reservations.controller.ts) | `POST /reservations`(예매), `POST /reservations/refund`(환불) |
| [code/apps/ticketing/src/reservations/reservations.module.ts](code/apps/ticketing/src/reservations/reservations.module.ts) | `PaymentsModule`을 가져오는 `ReservationsModule` |
| [code/apps/ticketing/src/reservations/reservations.service.spec.ts](code/apps/ticketing/src/reservations/reservations.service.spec.ts) | Nest 없이 가짜 결제사를 넣어 예매 서비스를 시험하는 vitest 테스트 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | imports에 `ReservationsModule` 추가 |

### 실행 결과

서버 부팅 로그. 결제사 객체가 그것을 받는 서비스보다 먼저, listen 전에 하나 만들어진다.

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
PaymentGateway #1 생성
ReservationsService 생성
RefundsService 생성
LOG [InstanceLoader] PaymentsModule dependencies initialized
SeatsService 생성
LOG [InstanceLoader] AppModule dependencies initialized
LOG [InstanceLoader] ReservationsModule dependencies initialized
...
LOG [NestApplication] Nest application successfully started
```

예매 요청 세 번의 응답. 세 요청 모두 같은 객체(#1)를 쓰고, 요청 중에는 생성 로그가 찍히지 않는다.

```text
{"seatId":"A-3-11","approvalId":"pay-1-110000","amount":110000}
{"seatId":"A-3-12","approvalId":"pay-1-110000","amount":110000}
{"seatId":"A-3-13","approvalId":"pay-1-110000","amount":110000}
```

`npx vitest run apps/ticketing/src/reservations`의 출력. 결제사를 부르지 않고 Nest도 띄우지 않는다.

```text
 RUN  v4.1.12

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Duration  511ms
```

빌드 결과에 남은 생성자 인자 타입 목록. `grep -n -A7 "^ReservationsService = _ts_decorate" dist/apps/ticketing/main.js`로 찾는다.

```js
ReservationsService = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _payments_payment_gateway_js__rspack_import_1.PaymentGateway === "undefined" ? Object : _payments_payment_gateway_js__rspack_import_1.PaymentGateway
    ])
], ReservationsService);
```

### 해 볼 때 참고

나쁜 예는 하나씩 바꿔 보고 확인한 뒤 되돌린다.

**서비스 안에서 new.** 두 서비스의 생성자 인자를 지우고 `PaymentGateway`를 직접 만든다. 예매는 메서드 안에서, 환불은 필드에서 만든다.

```ts
// reservations.service.ts
@Injectable()
export class ReservationsService {
  async reserve(seatId: string, amount: number) {
    const gateway = new PaymentGateway();
    const payment = await gateway.charge(amount);
    return { seatId, ...payment };
  }
}

// refunds.service.ts
@Injectable()
export class RefundsService {
  private readonly gateway = new PaymentGateway();

  refund(approvalId: string) {
    return this.gateway.refund(approvalId);
  }
}
```

이 상태로 부팅하고 같은 curl을 세 번 보낸 결과. #1은 부팅 때 환불 서비스 필드에서, #2~#4는 예매 요청마다 하나씩 생긴다.

```text
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
PaymentGateway #1 생성
SeatsService 생성
...
LOG [NestApplication] Nest application successfully started

$ (POST /reservations 세 번)
{"seatId":"A-3-11","approvalId":"pay-2-110000","amount":110000}
{"seatId":"A-3-12","approvalId":"pay-3-110000","amount":110000}
{"seatId":"A-3-13","approvalId":"pay-4-110000","amount":110000}

PaymentGateway #2 생성
PaymentGateway #3 생성
PaymentGateway #4 생성
```

**생성자에 인자 추가.** 서비스 안에서 new 하는 상태에서 `PaymentGateway` 생성자에 `secretKey: string`, `timeoutMs: number` 두 인자를 더하고 `npx tsc --noEmit -p apps/ticketing/tsconfig.app.json`을 돌린다. new 하던 파일마다 에러가 난다.

```text
apps/ticketing/src/reservations/refunds.service.ts(6,30): error TS2554: Expected 2 arguments, but got 0.
apps/ticketing/src/reservations/reservations.service.ts(7,21): error TS2554: Expected 2 arguments, but got 0.
```

**import type.** code/ 그대로에서 reservations.service.ts의 `import { PaymentGateway }`를 `import type { PaymentGateway }`로 바꾼다. 에디터나 린트의 자동 수정이 이렇게 바꾸는 경우가 있다. `npx tsc --noEmit -p apps/ticketing/tsconfig.app.json; echo $?`는 0으로 통과하지만, `npx nest build` 후 `node dist/apps/ticketing/main.js`는 부팅에서 멈춘다.

```text
ERROR [ExceptionHandler] UnknownDependenciesException [Error]: Nest can't resolve dependencies of the ReservationsService (?). Please make sure that the argument at index [0] is available in the current module.

Potential solutions:
- The dependency at index [0] appears to be undefined at runtime
- This commonly occurs when using 'import type' instead of 'import' for injectable classes
```

이때 빌드 결과의 타입 목록에는 클래스 대신 `Object`가 남는다.

```js
ReservationsService = _ts_decorate([
    (0,_nestjs_common__rspack_import_0.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof PaymentGateway === "undefined" ? Object : PaymentGateway
    ])
], ReservationsService);
```

생성자 인자 타입을 읽으려면 tsconfig의 `emitDecoratorMetadata`, `experimentalDecorators`가 둘 다 `true`여야 한다. code/의 tsconfig.json은 이미 켜져 있다.

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0, Nest CLI 12.0.10 | 2026-10-26 |
| 빌더 | rspack 2.2.9(builtin swc-loader, 메타데이터는 `_ts_metadata`로 출력) | 2026-10-26 |
| TypeScript | 6.0.3, tsconfig `emitDecoratorMetadata: true`, `experimentalDecorators: true` | 2026-10-26 |
| vitest | 4.1.12, 1 passed, 511ms | 2026-10-26 |
| import type 부팅 에러의 안내 문구 | "This commonly occurs when using 'import type' instead of 'import' for injectable classes" | 2026-10-26 |
| Prisma 커넥션 풀 | "a new connection pool is created with each new instance of PrismaClient" / "To avoid too many connections in a long-running application, we recommend that you use a single instance of PrismaClient across your application." | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 환경마다 다른 결제사 객체 넣기 | [18강](../../part2/lecture18/) |
| 요청마다·주입받는 곳마다 만드는 프로바이더 | [19강](../../part2/lecture19/) |
| Nest 테스트 모듈과 프로바이더 오버라이드 | [32강](../../part2/lecture32/), [33강](../../part2/lecture33/) |
| 진짜 결제사 호출의 타임아웃과 재시도 | 210강, 211강 |
| DB 클라이언트와 커넥션 풀 설정 | 70강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

# 21강. 순환 의존, ModuleRef, 지연 로딩, Discovery

제2부 NestJS 핵심 · 5장 의존성 주입

[← 20강](../../part2/lecture20/) | [제2부 목록](../) | [22강 →](../../part2/lecture22/)

## 이번 강의 질문

두 서비스가 서로를 필요로 하거나, 무엇을 넣을지 실행 중에야 알 수 있을 때 주입을 어떻게 다루나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 20강 끝 코드([../../part2/lecture20/code/](../../part2/lecture20/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 예매 서비스가 알림 서비스에 값을 넘기는 한 방향 구조, Discovery로 모으는 알림 채널, 요청 때 지연 로딩하는 영수증 모듈이 들어 있다. 아래 명령은 bash 기준이다
- 서버는 시작할 때 code/ 안의 `.env`를 읽는다. [20강 실습 자료](../../part2/lecture20/)와 같은 내용으로 만든다. 이 강은 `PAYMENT_MODE=fake`로 띄워서 가짜 결제사 서버가 없어도 된다

채널을 골라 예매를 하나 보내는 스크립트를 code/ 밖에 `send.mjs`로 저장한다.

```js
const [port, channel] = process.argv.slice(2);
const r = await fetch(`http://localhost:${port}/reservations`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ seatId: 'A-3-15', amount: 110000, buyer: '김민수', channel }),
});
console.log(await r.text());
```

```bash
cd code
npm install
npx nest build
PAYMENT_MODE=fake PORT=4021 node dist/apps/ticketing/main.js &
for c in sms email push kakao; do node ../send.mjs 4021 $c; done
curl -s localhost:4021/reservations/1/receipt
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/notifications/notification-channel.ts](code/apps/ticketing/src/notifications/notification-channel.ts) | `DiscoveryService.createDecorator`로 만든 `@NotificationChannel` 데코레이터와 `ChannelSender` 타입 |
| [code/apps/ticketing/src/notifications/sms.sender.ts](code/apps/ticketing/src/notifications/sms.sender.ts) | 문자 채널(`sms`) |
| [code/apps/ticketing/src/notifications/email.sender.ts](code/apps/ticketing/src/notifications/email.sender.ts) | 메일 채널(`email`) |
| [code/apps/ticketing/src/notifications/push.sender.ts](code/apps/ticketing/src/notifications/push.sender.ts) | 앱 푸시 채널(`push`) |
| [code/apps/ticketing/src/notifications/notifications.service.ts](code/apps/ticketing/src/notifications/notifications.service.ts) | 부팅 때(`onModuleInit`) 채널 표시가 붙은 프로바이더를 모아 두고, 받는 사람·좌석·채널을 인자로 받아 확정 알림을 만든다. 예매 서비스를 모른다 |
| [code/apps/ticketing/src/notifications/notifications.module.ts](code/apps/ticketing/src/notifications/notifications.module.ts) | `DiscoveryModule`을 가져오고 세 채널을 등록한다 |
| [code/apps/ticketing/src/reservations/reservations.service.ts](code/apps/ticketing/src/reservations/reservations.service.ts) | 예매를 Map에 저장하고, 결제 뒤 알림 서비스에 구매자·좌석·채널을 넘긴다 |
| [code/apps/ticketing/src/reservations/reservations.controller.ts](code/apps/ticketing/src/reservations/reservations.controller.ts) | 예매 본문에 `channel` 추가, `GET /reservations/:id/receipt`에서 영수증 모듈을 `LazyModuleLoader`로 불러온다 |
| [code/apps/ticketing/src/reservations/reservations.module.ts](code/apps/ticketing/src/reservations/reservations.module.ts) | imports에 `NotificationsModule` |
| [code/apps/ticketing/src/receipts/receipts.service.ts](code/apps/ticketing/src/receipts/receipts.service.ts) | 무거운 라이브러리를 불러오는 데 0.8초가 걸리는 상황을 흉내 낸 영수증 서비스 |
| [code/apps/ticketing/src/receipts/receipts.module.ts](code/apps/ticketing/src/receipts/receipts.module.ts) | 영수증 모듈. AppModule에 넣지 않고 요청 때 불러온다 |

### 실행 결과

부팅 로그의 알림 채널과 채널 네 번 요청의 응답(응답 앞부분은 줄였다).

```text
알림 채널: sms, email, push

{"id":1,...,"message":"[문자 → 김민수] A-3-15 예매가 확정되었습니다"}
{"id":2,...,"message":"[메일 → 김민수] A-3-15 예매가 확정되었습니다"}
{"id":3,...,"message":"[앱 푸시 → 김민수] A-3-15 예매가 확정되었습니다"}
{"id":4,...,"message":"지원하지 않는 채널: kakao"}
```

`npx nest build` 뒤의 빌드 폴더. 동적 import 때문에 영수증 코드가 별도 파일로 나뉜다.

```text
$ ls dist/apps/ticketing
0.main.js  0.main.js.map  1.main.js  1.main.js.map  main.js  main.js.map
```

기동 시간과 영수증 호출 시간(3회씩)은 시효성 데이터 표에 있다. 기동은 프로세스 시작부터 첫 응답까지다.

| 방식 | 기동 | 영수증 첫 호출 | 두 번째 |
|---|---|---|---|
| 정적 import | 1,858~1,955ms | 3~4ms | 1~4ms |
| 지연 로딩 | 1,109~1,179ms | 807~813ms | 1~2ms |

### 해 볼 때 참고

나쁜 예는 하나씩 바꿔 보고 확인한 뒤 되돌린다.

**서로를 부르는 두 서비스.** 알림 서비스가 생성자로 예매 서비스를 받아 `findOne`으로 구매자와 좌석을 조회하게 바꾸고, 알림 모듈 imports에 `ReservationsModule`, 예매 모듈에 `exports: [ReservationsService]`를 더한다. `PAYMENT_MODE=fake PORT=4021 node dist/apps/ticketing/main.js`는 Nest 로그가 한 줄도 찍히기 전에 멈춘다.

```ts
@Injectable()
export class NotificationsService {
  constructor(private readonly reservations: ReservationsService) {}

  sendConfirmed(reservationId: number) {
    const r = this.reservations.findOne(reservationId);
    return `${r.buyer}님, ${r.seatId} 예매가 확정되었습니다`;
  }
}

@Module({
  imports: [ReservationsModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

예매 서비스는 `message: this.notifications.sendConfirmed(id)`로 부른다.

```text
file:///.../dist/apps/ticketing/main.js:864
  NotificationsService: () => (NotificationsService)
                               ^

ReferenceError: Cannot access 'NotificationsService' before initialization
```

**양쪽에 forwardRef.** 두 모듈 imports를 `forwardRef(() => NotificationsModule)`, `forwardRef(() => ReservationsModule)`로, 두 생성자 인자를 `@Inject(forwardRef(() => ...))`로 바꿔도 같은 에러가 난다. forwardRef는 Nest의 주입 시점을 늦추지만, 생성자 인자 타입 목록은 클래스를 정의하는 순간 계산되기 때문이다.

**WrapperType.** 타입 하나를 `apps/ticketing/src/common-types.ts`에 두고 예매 서비스 쪽 생성자 인자만 감싸면(알림 쪽은 forwardRef만) 부팅된다.

```ts
// 메타데이터에 클래스 이름이 남지 않게 감싸는 타입 (ES 모듈의 순환 import 대응)
export type WrapperType<T> = T;
```

```ts
@Inject(forwardRef(() => NotificationsService))
private readonly notifications: WrapperType<NotificationsService>,
```

```text
LOG [NestApplication] Nest application successfully started
{"id":1,"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"message":"김민수님, A-3-15 예매가 확정되었습니다"}
```

**ModuleRef의 get과 resolve.** 알림 서비스가 생성자에서 `ModuleRef`만 받고, `onModuleInit`에서 `this.moduleRef.get(ReservationsService, { strict: false })`로 예매 서비스를 꺼내게 하면 알림 모듈 imports에서 예매 모듈을 뺄 수 있다. 같은 `onModuleInit`에 아래 줄을 더하면 TRANSIENT 로거는 `resolve`할 때마다 새로 생기고, `get`으로 꺼내면 예외로 부팅이 끝난다.

```ts
const a = await this.moduleRef.resolve(TaggedLogger, undefined, { strict: false });
const b = await this.moduleRef.resolve(TaggedLogger, undefined, { strict: false });
console.log(`resolve 두 번: 같은 객체인가? ${a === b}`);
this.moduleRef.get(TaggedLogger, { strict: false });
```

```text
TaggedLogger #3 생성
TaggedLogger #4 생성
resolve 두 번: 같은 객체인가? false
InvalidClassScopeException [Error]: TaggedLogger is marked as a scoped provider. Request and transient-scoped providers can't be used in combination with "get()" method. Please, use "resolve()" instead.
```

**기동 시간 재기.** 아래 스크립트를 code/ 밖에 `startup.mjs`로 두고 `node startup.mjs code 4021`처럼 프로젝트 폴더와 포트를 넘긴다. 정적 import와 비교하려면 AppModule imports에 `ReceiptsModule`을 넣고 다시 빌드해 같은 스크립트를 돌린다.

```js
import { spawn } from 'node:child_process';
const [dir, port] = process.argv.slice(2);
const t0 = performance.now();
const child = spawn(process.execPath, ['dist/apps/ticketing/main.js'], {
  cwd: dir, env: { ...process.env, PORT: port, PAYMENT_MODE: 'fake' }, stdio: 'ignore',
});
for (;;) {
  try { await fetch(`http://localhost:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 20)); }
}
const up = performance.now() - t0;
const time = async () => { const s = performance.now(); await (await fetch(`http://localhost:${port}/reservations/1/receipt`)).text(); return performance.now() - s; };
const first = await time();
const second = await time();
console.log(`기동 ${Math.round(up)}ms, 영수증 첫 호출 ${Math.round(first)}ms, 두 번째 ${Math.round(second)}ms`);
child.kill();
```

지연 로딩 모듈은 처음 불러올 때 캐시된다. 지연 로딩 모듈의 컨트롤러는 라우트로 등록되지 않고, 수명주기 훅도 불리지 않는다.

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0 (DiscoveryService.createDecorator, LazyModuleLoader 사용) | 2026-10-26 |
| 빌더 | rspack 2.2.9, 동적 import를 청크 파일(0.main.js, 1.main.js)로 분리 | 2026-10-26 |
| 공식 문서(순환 의존) | "Avoid circular dependencies where possible, but you can't always do so." / "The order of instantiation is indeterminate." / "Avoid barrel files for module and provider classes." | 2026-10-26 |
| 공식 문서(SWC 절) | "Wrapper type used to circumvent ESM modules circular dependency issue", `export type WrapperType<T> = T;` | 2026-10-26 |
| 공식 문서(지연 로딩) | "Lazy loading can decrease bootstrap time by loading only the modules required by a specific serverless function invocation." / 캐시, 컨트롤러·게이트웨이·리졸버 제약, 수명주기 훅 미호출 | 2026-10-26 |
| 기동 시간 실측 | 지연 로딩: 기동 1,165/1,109/1,179ms, 첫 호출 807/807/813ms, 두 번째 2/1/2ms. 정적 import: 기동 1,924/1,955/1,858ms, 첫 호출 3/4/4ms, 두 번째 4/1/1ms (3장 변경이 들어간 프로젝트 코드에서 다시 잼) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 수명주기 훅의 순서(onModuleInit 등) | [29강](../../part2/lecture29/) |
| 이벤트로 예매와 알림 떼기 | 37강 |
| 결제 수단 고르기(전략 패턴) | 36강 |
| 커스텀 데코레이터와 Reflector | [28강](../../part2/lecture28/) |
| 서버리스와 콜드 스타트 | 255강 |
| 실제 문자·메일 발송과 실패 처리 | 174~186강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

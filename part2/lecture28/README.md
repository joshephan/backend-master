# 28강. 커스텀 데코레이터와 메타데이터

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 27강](../../part2/lecture27/) | [제2부 목록](../) | [29강 →](../../part2/lecture29/)

## 이번 강의 질문

"이 핸들러는 실장만", "이 필드는 내보내지 않음" 같은 표시를 코드에 붙이고, 그 표시대로 동작하게 하려면 무엇이 표시를 읽어야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0). Docker는 필요 없다
- 27강 끝 코드([../../part2/lecture27/code/](../../part2/lecture27/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에 `.env` 파일을 만든다. main.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 서버가 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- `code/`에서 `npm install` 뒤 `PORT=4028 PAYMENT_MODE=fake npm run start`로 서버를 띄운다
- 공연·회차·좌석 준비는 [26강](../../part2/lecture26/)과 같다(포트만 4028)
- 직원 키는 메모리에 셋이 있다: `key-kim`(김매표, 판매원), `key-lee`(이실장, 실장), `key-park`(박기획, 기획팀)

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/roles.decorator.ts](code/apps/ticketing/src/common/roles.decorator.ts) | `Reflector.createDecorator<StaffRole[]>()`로 만든 Roles 데코레이터 |
| [code/apps/ticketing/src/common/staff-key.guard.ts](code/apps/ticketing/src/common/staff-key.guard.ts) | `getAllAndOverride`로 메서드·클래스의 Roles를 읽는 가드. 표시가 없으면 통과, 키가 틀리면 401, 역할이 맞지 않으면 403 |
| [code/apps/ticketing/src/common/current-staff.decorator.ts](code/apps/ticketing/src/common/current-staff.decorator.ts) | 가드가 `req.staff`에 실어 둔 직원을 핸들러 인자로 꺼내는 CurrentStaff |
| [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | 클래스에 `@Roles(['clerk', 'manager'])`, 판매 취소(release)에 `@Roles(['manager'])`, `@UseGuards` 삭제 |
| [code/apps/ticketing/src/seats/seats.service.ts](code/apps/ticketing/src/seats/seats.service.ts) | release: SOLD를 AVAILABLE로, SOLD가 아니면 SeatNotSoldError |
| [code/apps/ticketing/src/seats/seat-errors.ts](code/apps/ticketing/src/seats/seat-errors.ts) | SeatNotSoldError(conflict) 추가 |
| [code/apps/ticketing/src/seats/seats.module.ts](code/apps/ticketing/src/seats/seats.module.ts) | imports에서 StaffModule 삭제 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | imports에 StaffModule, providers에 `{ provide: APP_GUARD, useClass: StaffKeyGuard }` |

### 실행 결과

세 직원으로 판매와 판매 취소를 보냈을 때:

```bash
B=localhost:4028/box-office/performances/1/seats
curl -X POST $B/A-1-1/sell -H 'x-staff-key: key-kim'
curl -X POST $B/A-1-1/release -H 'x-staff-key: key-kim'
curl -X POST $B/A-1-1/release -H 'x-staff-key: key-lee'
curl -X POST $B/A-1-1/release -H 'x-staff-key: key-lee'
curl -X POST $B/A-1-2/sell -H 'x-staff-key: key-park'
```

```text
판매 김매표      {"id":"A-1-1", …,"status":"SOLD","soldBy":"김매표"} [201]
취소 김매표      {"title":"Forbidden","status":403,"detail":"김매표님은 이 작업 권한이 없습니다", …} [403]
취소 이실장      {"id":"A-1-1", …,"status":"AVAILABLE","releasedBy":"이실장"} [201]
다시 취소 이실장  {"seatId":"A-1-1","type":"…/problems/seat-not-sold","status":409, …} [409]
판매 박기획      {"title":"Forbidden","status":403,"detail":"박기획님은 이 작업 권한이 없습니다", …} [403]
```

가드가 메서드의 표시만 읽게(`reflector.get(Roles, context.getHandler())`) 했을 때. 클래스에만 표시가 있는 판매는 키 없이 가드를 통과해 좌석이 팔리고, 응답은 500이다:

```text
$ curl -X POST localhost:4028/box-office/performances/1/seats/A-1-1/sell      (키 없음)
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.", …} [500]
ERROR [ProblemDetails] TypeError: Cannot read properties of undefined (reading 'name')

$ curl "localhost:4028/performances/1/seats?row=1&status=SOLD"
[{"id":"A-1-1","label":"A구역 1열 1번","status":"SOLD"}]

$ curl -X POST localhost:4028/box-office/performances/1/seats/A-1-1/release   (키 없음)
{"title":"Unauthorized","status":401, …} [401]
```

전역 가드로 바꾼 뒤, 표시가 없는 고객용 주소는 그대로 열린다:

```text
$ curl localhost:4028/concerts
[200]
```

`@StaffOnly(...)`로 Roles와 `Cache-Control: no-store` 헤더를 묶어 판매 메서드에 붙였을 때:

```text
$ curl -i -X POST …/seats/A-1-1/sell -H 'x-staff-key: key-kim'
HTTP/1.1 201 Created
Cache-Control: no-store
```

`@Exclude()`와 ClassSerializerInterceptor. 공연 서비스가 객체 리터럴을 돌려줄 때는 settlementRate가 그대로 나가고, Concert 인스턴스를 돌려줄 때만 빠진다:

```text
(ConcertsService.create가 객체 리터럴로 만든 코드)
$ curl localhost:4028/concerts/1
{"id":1,"title":"가을 콘서트","venue":"올림픽홀","settlementRate":0.1,
 "createdAt":"2026-10-26T06:28:02.019Z"}

(Object.assign(new Concert(), { … })로 만든 코드)
$ curl localhost:4028/concerts/1
{"id":1,"title":"가을 콘서트","venue":"올림픽홀",
 "createdAt":"2026-10-26T06:28:07.360Z"}
```

데코레이터 인자에 환경 변수를 넣었을 때. `.env`에 `SEAT_MAP_MAX_AGE=2`가 있고 bootstrap에서는 2로 보이지만, 헤더에는 undefined가 들어간다:

```text
bootstrap 시점 SEAT_MAP_MAX_AGE = 2
$ curl -i "localhost:4028/performances/1/seats?row=1"
Cache-Control: max-age=undefined
```

### 해 볼 때 참고

아래 실험 코드는 [code/](code/)에 없다. 직접 바꿔 보고 되돌린다.

- 클래스 표시를 못 보는 가드: StaffKeyGuard에서 `getAllAndOverride(...)` 줄을 `this.reflector.get(Roles, context.getHandler())`로 바꾼다. 판매 메서드는 표시가 클래스에만 있어 표시 없음으로 보고 통과한다. 가드를 고친 뒤에는 키 없이 매표소 주소를 전부 불러 하나도 열리지 않는지 확인한다
- 데코레이터 묶기: `common/staff-only.decorator.ts`에 아래를 두고 판매·취소 메서드에 `@StaffOnly(...)`를 붙인다. 클래스에 붙이면 `@Header`가 메서드 전용이라 부팅 중 TypeError가 난다

```ts
// 직원 전용 표시 + 응답을 어디에도 저장하지 말 것
export const StaffOnly = (...roles: StaffRole[]) =>
  applyDecorators(Roles(roles), Header('Cache-Control', 'no-store'));
```

- 데코레이터가 도는 시점: 좌석 목록 핸들러에 ``@Header('Cache-Control', `max-age=${process.env.SEAT_MAP_MAX_AGE}`)``를 붙이고 `.env`에 `SEAT_MAP_MAX_AGE=2`를 넣는다. bootstrap 첫 줄에 `console.log('bootstrap 시점 SEAT_MAP_MAX_AGE =', process.env.SEAT_MAP_MAX_AGE)`를 넣으면 위 결과가 나온다. import한 파일의 데코레이터가 main.ts 본문의 `process.loadEnvFile()`보다 먼저 실행되기 때문이다
- ClassSerializerInterceptor: Concert 엔티티의 settlementRate에 `@Exclude()`를 붙이고 main.ts에 `app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))`를 넣은 뒤, 공연 조회가 응답 DTO 대신 엔티티를 그대로 돌려주게 바꾼다. 이어서 ConcertsService.create를 `Object.assign(new Concert(), { ... })`로 바꿔 차이를 본다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS | @nestjs/common·core 12.2.0 (Reflector.createDecorator, getAllAndOverride) | 2026-10-26 |
| class-transformer | 0.5.1 (@Exclude, instanceToPlain) | 2026-10-26 |
| @Header를 클래스에 붙였을 때 | 부팅 중 TypeError: Cannot read properties of undefined (reading 'value') | 2026-10-26 |
| 빌더 | rspack 2.2.9, ES 모듈 출력 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 회원 로그인과 기본 거부(@Public) 방식 | 137강, 138강 |
| 역할·권한 모델(RBAC)과 자원 단위 권한 | 151강, 152강 |
| 응답 캐시 헤더와 HTTP 캐시 | 131강 |
| 설정 모듈과 설정 검증 | 244강 |
| 데코레이터 메타데이터를 쓰는 OpenAPI 문서 생성 | 51강 |
| 데코레이터·가드 테스트 | [32강](../../part2/lecture32/), [33강](../../part2/lecture33/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

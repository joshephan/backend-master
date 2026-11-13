# 24강. 가드와 실행 컨텍스트

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 23강](../../part2/lecture23/) | [제2부 목록](../) | [25강 →](../../part2/lecture25/)

## 이번 강의 질문

"이 요청을 들여보낼까"를 정하는 코드는 왜 미들웨어가 아니라 가드에 두고, 가드는 무엇을 보고 판단하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 23강 끝 코드([../../part2/lecture23/code/](../../part2/lecture23/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 매표소 컨트롤러에 직원 키 가드 `StaffKeyGuard`를 건 버전이다. 아래 명령은 bash 기준이다
- 서버는 code/ 안의 `.env`를 읽으므로 [20강 실습 자료](../../part2/lecture20/)와 같은 내용으로 만든다. 공연 등록 본문 `concert.json`은 [23강 실습 자료](../../part2/lecture23/)와 같다

```bash
cd code
npm install
npx nest build
PORT=4024 PAYMENT_MODE=fake node dist/apps/ticketing/main.js
```

다른 터미널에서 공연, 회차, 좌석을 먼저 만든 뒤 직원 키를 바꿔 가며 판매 요청을 보낸다. 직원 키는 `key-kim`(김매표, 판매원), `key-lee`(이실장, 실장), `key-park`(박기획, 기획팀)이다.

```bash
curl -X POST localhost:4024/concerts -H 'content-type: application/json' --data-binary @concert.json
curl -X POST localhost:4024/performances -H 'content-type: application/json' -d '{"concertId":1,"startsAt":"2026-11-20T19:00:00+09:00"}'
curl -X POST localhost:4024/performances/1/seats

curl -X POST localhost:4024/box-office/performances/1/seats/A-1-1/sell -H 'x-staff-key: key-nope'
curl -X POST localhost:4024/box-office/performances/1/seats/A-1-1/sell -H 'x-staff-key: key-park'
curl -X POST localhost:4024/box-office/performances/1/seats/A-1-1/sell -H 'x-staff-key: key-kim'
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/staff-key.guard.ts](code/apps/ticketing/src/common/staff-key.guard.ts) | 직원 키 가드. 실행 컨텍스트로 컨트롤러·핸들러 이름을 찍고, 키가 없거나 틀리면 401, 기획팀이면 403, 통과하면 찾은 직원을 `req.staff`에 싣는다 |
| [code/apps/ticketing/src/staff/staff.service.ts](code/apps/ticketing/src/staff/staff.service.ts) | 직원 키로 직원을 찾는 `verify`. DB 조회를 흉내 내 5ms 기다린다 |
| [code/apps/ticketing/src/staff/staff.module.ts](code/apps/ticketing/src/staff/staff.module.ts) | `StaffService`를 등록하고 내보낸다 |
| [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | 클래스에 `@UseGuards(StaffKeyGuard)`. 판매 응답에 `req.staff.name`을 `soldBy`로 더한다 |
| [code/apps/ticketing/src/seats/seats.module.ts](code/apps/ticketing/src/seats/seats.module.ts) | imports에 `StaffModule` 추가(가드가 `StaffService`를 주입받는다) |

### 실행 결과

직원 키 세 개로 보낸 판매 요청. 누구인지 모르면 401, 누구인지 알지만 매표 권한이 없으면 403이다.

```text
$ curl -X POST …/sell -H 'x-staff-key: key-nope'
{"title":"Unauthorized","status":401,"detail":"직원 키가 없거나 맞지 않습니다", …}

$ curl -X POST …/sell -H 'x-staff-key: key-park'
{"title":"Forbidden","status":403,"detail":"박기획님은 매표 권한이 없습니다", …}

$ curl -X POST …/sell -H 'x-staff-key: key-kim'
{"id":"A-1-1","label":"A구역 1열 1번","status":"SOLD","soldBy":"김매표"} [201]
```

키 없이 보낸 판매 요청은 경로를 소문자로 쓰든 대문자(`/Box-Office/…`)로 쓰든 401이다. 가드는 경로 문자열을 비교하지 않고, 라우터가 고른 핸들러에 붙어 실행된다.

```text
$ curl -X POST localhost:4024/box-office/performances/1/seats/A-1-1/sell
{"type":"about:blank","title":"Unauthorized","status":401,
 "detail":"직원 키가 없거나 맞지 않습니다", …} [401]

$ curl -X POST localhost:4024/Box-Office/performances/1/seats/A-1-1/sell
{"type":"about:blank","title":"Unauthorized","status":401,
 "detail":"직원 키가 없거나 맞지 않습니다", …} [401]
```

이때 가드와 요청 로그. 두 요청 모두 같은 클래스, 같은 메서드로 간다.

```text
LOG [StaffKeyGuard] http BoxOfficeController.sell
LOG [HTTP] 492b1def-… POST /box-office/performances/1/seats/A-1-1/sell 401 10.3ms
LOG [StaffKeyGuard] http BoxOfficeController.sell
LOG [HTTP] ceeee3a6-… POST /Box-Office/performances/1/seats/A-1-1/sell 401 13.2ms
```

### 해 볼 때 참고

- **경로 문자열로 막지 않는다.** 매표소 경로인지 `req.path.startsWith('/box-office')`로 판단해 직원 키를 확인하는 미들웨어는 막지 못하는 요청이 생긴다. Express 기본 라우팅은 대소문자를 구분하지 않고 끝 슬래시를 무시하는데, 문자열 비교는 그렇지 않아서 검사와 라우팅이 같은 경로를 다르게 읽는다. 이렇게 지나간 요청은 로그에 정상 판매 201로만 남는다
- **await를 빠뜨리지 않는다.** 가드에서 `verify` 앞의 `await`를 빠뜨리면 반환값이 Promise 객체라서 늘 참으로 평가되고, 에러나 경고 없이 모든 요청이 통과한다. 가드를 시험할 때는 통과보다 막히는 경우(틀린 키, 키 없음)를 먼저 확인한다
- **false 대신 예외를 던진다.** `canActivate`가 false를 돌려주면 Nest는 늘 `403 Forbidden resource`로 답한다. 401과 403을 나누려면 code/처럼 `UnauthorizedException`, `ForbiddenException`을 직접 던진다
- **APP_GUARD로 전역에 걸면.** AppModule에 아래처럼 등록하면 어느 모듈에 적어도 앱 전체에 걸려, 고객 앱이 쓰는 API까지 401이 된다. code/는 매표소 컨트롤러에만 건다

```ts
@Module({
  imports: [ /* … */ StaffModule],
  providers: [AppService, { provide: APP_GUARD, useClass: StaffKeyGuard }],
})
export class AppModule {}
```

```text
$ curl localhost:4024/concerts
{"title":"Unauthorized","status":401,"detail":"직원 키가 없거나 맞지 않습니다", …}
$ curl localhost:4024/performances/1/seats
{"title":"Unauthorized","status":401, …}

LOG [StaffKeyGuard] http ConcertsController.findAll
LOG [StaffKeyGuard] http SeatsController.findAll
```

`app.useGlobalGuards(new StaffKeyGuard(new StaffService()))`처럼 main.ts에서 걸면 `StaffService`를 직접 만들어야 하고, Nest가 만든 `StaffService`와는 다른 객체가 된다.

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS·Express | @nestjs/core 12.2.0, Express 5.3.0 | 2026-10-26 |
| Express 라우팅 기본값 | 대소문자 구분 안 함, 끝 슬래시 무시 | 2026-10-26 |
| 가드가 false일 때 본문 | "Forbidden resource", 403 | 2026-10-26 |
| 가드 포함 판매 요청 시간 | 10.3~18.6ms(verify 5ms 대기 포함) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 핸들러에 "직원 전용" 표시를 붙이고 가드가 읽기 | [28강](../../part2/lecture28/) |
| 요청 객체 대신 데코레이터로 req.staff 꺼내기 | [28강](../../part2/lecture28/) |
| 회원 로그인과 JWT | 137강, 138강 |
| 역할·권한 모델(RBAC) | 151강, 152강 |
| rpc·ws 실행 컨텍스트를 쓰는 앱 | [31강](../../part2/lecture31/) |
| 가드 테스트 | [32강](../../part2/lecture32/) |
| 직원 키 보관과 교체 | 168강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

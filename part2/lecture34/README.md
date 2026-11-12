# 34강. 통합 테스트와 Testcontainers

제2부 NestJS 핵심 · 8장 테스트 기초

[← 33강](../../part2/lecture33/) | [제2부 목록](../) | [35강 →](../../part2/lecture35/)

## 이번 강의 질문

메모리 가짜로는 다 통과하는 코드가 진짜 DB에서는 왜 다르게 동작하고, 그 차이를 어떻게 매번 깨끗한 진짜 DB로 잡나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0), Docker(실행 환경은 Docker Desktop 4.49.0, Engine 28.5.1). 통합 테스트는 Docker가 돌고 있어야 한다
- 33강 끝 코드([../../part2/lecture33/code/](../../part2/lecture33/code/))에서 시작해 아래 패키지를 더한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다

```bash
npm install pg
npm install -D @testcontainers/postgresql @types/pg
docker pull postgres:17-alpine
```

- `code/`에서 `npm install` 뒤 유닛 테스트는 `npx vitest run`, 통합 테스트는 `npm run test:int`
- 통합 테스트 코드는 컨테이너에 고정 이름을 붙인다(`withName`). 같은 이름의 컨테이너가 남아 있으면 시작에 실패하므로, 여러 곳에서 동시에 돌릴 때는 `withName`을 뺀다

서버를 PostgreSQL에 붙여 띄울 때. `DATABASE_URL`이 없으면 메모리 저장소로 뜬다. `.env`와 가짜 외부 서버(포트 5034)는 [29강](../../part2/lecture29/)과 같이 준비한다:

```bash
docker run -d --name ticketing-pg -e POSTGRES_PASSWORD=test -p 55434:5432 postgres:17-alpine
docker exec -i ticketing-pg psql -U postgres -q < db/schema.sql
npx nest build ticketing
PORT=4034 TCP_PORT=6034 PAYMENT_MODE=fake PG_URL=http://localhost:5034 SMS_URL=http://localhost:5034/sms \
  DATABASE_URL=postgres://postgres:test@localhost:55434/postgres node dist/apps/ticketing/main.js &
```

가짜 외부 서버는 발신번호 응답 지연 없이(`SENDER_DELAY_MS=0`) 띄웠다. 끝나면 띄운 프로세스를 끄고 `docker rm -f ticketing-pg`로 컨테이너를 지운다.

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/seats/seats.repository.ts](code/apps/ticketing/src/seats/seats.repository.ts) | 좌석 저장소 추상 클래스(insertMany, findAll, findOne, changeIfAvailable, changeIfSold, countAvailable) |
| [code/apps/ticketing/src/seats/in-memory-seats.repository.ts](code/apps/ticketing/src/seats/in-memory-seats.repository.ts) | Map에 저장하는 저장소. DB 없이 띄울 때와 유닛 테스트용 |
| [code/apps/ticketing/src/seats/pg-seats.repository.ts](code/apps/ticketing/src/seats/pg-seats.repository.ts) | pg 드라이버로 PostgreSQL에 저장. 남은 좌석 수는 `count(*)::int`로 받음 |
| [code/db/schema.sql](code/db/schema.sql) | seats 테이블. 기본 키는 회차 번호 + 좌석 id |
| [code/apps/ticketing/src/seats/pg-seats.repository.int-spec.ts](code/apps/ticketing/src/seats/pg-seats.repository.int-spec.ts) | Testcontainers 통합 테스트. 파일마다 postgres:17-alpine 컨테이너 하나, 테스트마다 `TRUNCATE seats`. 테스트 네 개 |
| [code/vitest.config.int.ts](code/vitest.config.int.ts) | `*.int-spec.ts`만 돌리는 설정, hookTimeout 60초 |
| [code/package.json](code/package.json) | pg, @testcontainers/postgresql, @types/pg, 스크립트 `test:int` |
| [code/apps/ticketing/src/seats/seats.service.ts](code/apps/ticketing/src/seats/seats.service.ts) | 저장소를 생성자로 받고 메서드를 async로. summary(남은 좌석, 매진 여부), 같은 회차 좌석을 두 번 열면 SeatsAlreadyOpenError |
| [code/apps/ticketing/src/seats/seat-errors.ts](code/apps/ticketing/src/seats/seat-errors.ts) | SeatsAlreadyOpenError(conflict, 응답 409) 추가 |
| [code/apps/ticketing/src/seats/seats.module.ts](code/apps/ticketing/src/seats/seats.module.ts) | `DATABASE_URL`이 있으면 PgSeatsRepository, 없으면 InMemorySeatsRepository를 주는 팩토리 프로바이더 |
| [code/apps/ticketing/src/seats/seats.controller.ts](code/apps/ticketing/src/seats/seats.controller.ts) | async, `GET performances/:performanceId/seats/summary` |
| [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | async |
| [code/apps/ticketing/src/seats/seats.service.spec.ts](code/apps/ticketing/src/seats/seats.service.spec.ts) | 메모리 저장소와 await, 매진·두 번 열기 테스트 추가 |
| [code/apps/ticketing/src/seats/seats.module.spec.ts](code/apps/ticketing/src/seats/seats.module.spec.ts) | 메모리 저장소와 await |

### 실행 결과

남은 좌석 수를 `count(*)` 그대로 받던 코드로 서버를 PostgreSQL에 붙여 띄웠을 때. 60석을 창구에서 전부 판 뒤에도 매진이 뜨지 않고, available에 따옴표가 붙는다:

```text
$ curl -X POST localhost:4034/performances/1/seats
{"performanceId":1,"count":60}
$ curl localhost:4034/performances/1/seats/summary
{"performanceId":1,"available":"60","soldOut":false}

(60석을 창구에서 전부 판매, 헤더 x-staff-key: key-kim)

$ curl localhost:4034/performances/1/seats/summary
{"performanceId":1,"available":"0","soldOut":false}
$ curl -X POST localhost:4034/performances/1/seats/A-3-15/hold
{"seatId":"A-3-15","seatStatus":"SOLD","type":"https://api.ticketing.example/problems/seat-unavailable",
 "title":"SeatUnavailableError","status":409,"detail":"A구역 3열 15번은 이미 팔렸거나 선택된 좌석입니다",
 "instance":"/performances/1/seats/A-3-15/hold"}
```

같은 코드에서 메모리 저장소를 쓰는 유닛 테스트는 전부 통과한다:

```text
$ npx vitest run
 Test Files  10 passed (10)
      Tests  18 passed (18)
```

통합 테스트 첫 실행. 컨테이너 준비 시간과 포트는 실행마다 다르다:

```text
$ npm run test:int
컨테이너 준비: 2649ms, postgres://test:test@localhost:32768/test
 ✓ SeatsService + PostgreSQL > 빈 좌석을 붙잡으면 HELD가 된다 98ms
 ✓ SeatsService + PostgreSQL > 이미 붙잡힌 좌석을 또 붙잡으면 409 78ms
 × SeatsService + PostgreSQL > 남은 좌석이 없으면 매진 69ms

- Expected
+ Received
  {
-   "available": 0,
+   "available": "0",
    "performanceId": 1,
-   "soldOut": true,
+   "soldOut": false,
  }
```

PostgreSQL의 `count(*)`는 bigint이고, node-postgres는 bigint를 기본으로 문자열로 돌려준다. `query<{ count: number }>`는 확인 없는 타입 표시라 실행 때는 문자열 그대로이고, `"0" === 0`이 false라 매진이 아니게 된다. `count(*)::int`로 고친 뒤:

```text
 ✓ SeatsService + PostgreSQL > 빈 좌석을 붙잡으면 HELD가 된다 96ms
 ✓ SeatsService + PostgreSQL > 이미 붙잡힌 좌석을 또 붙잡으면 409 91ms
 ✓ SeatsService + PostgreSQL > 남은 좌석이 없으면 매진 88ms
      Tests  3 passed (3)
```

같은 회차 좌석을 두 번 열었을 때. 서비스 코드는 같고 저장소만 다르다:

| 저장소 | 같은 회차 좌석을 두 번 열면 | 결과 |
|---|---|---|
| InMemorySeatsRepository | 60석을 또 추가 | 120석, 남은 좌석 119 (`{"performanceId":1,"available":119,"soldOut":false}`) |
| PgSeatsRepository | 기본 키 위반 | 로그에 `duplicate key value violates unique constraint "seats_pkey"`, 응답 500 (detail '요청을 처리하지 못했습니다.') |

서비스에서 두 번 열기를 막고 테스트를 더한 뒤(이 강의 [code/](code/)):

```text
$ npm run test:int
 ✓ SeatsService + PostgreSQL > 같은 회차 좌석을 두 번 열면 409 83ms
      Tests  4 passed (4)
```

### 해 볼 때 참고

- 매진 버그 재현: [code/apps/ticketing/src/seats/pg-seats.repository.ts](code/apps/ticketing/src/seats/pg-seats.repository.ts)의 countAvailable 쿼리에서 `count(*)::int AS count`를 `count(*)`로 바꾼다. 유닛 테스트는 통과하고 통합 테스트의 매진 테스트만 실패한다
- 두 번 열기: 서비스의 open에서 이미 열린 회차를 검사하는 `if` 블록을 지우고 같은 회차에 `POST /performances/1/seats`를 두 번 보낸다. 메모리 저장소는 에러 없이 120석이 되고, PostgreSQL은 기본 키 위반으로 500이 된다
- 통합 테스트가 한꺼번에 실패하면 먼저 Docker가 돌고 있는지 본다. 컨테이너 준비는 PC가 한가할 때 2초 남짓, 다른 작업과 겹칠 때 13~29초가 걸렸다. vitest의 hookTimeout 기본값(10초)을 넘을 수 있어 설정에서 60초로 늘렸다
- 다른 컨테이너와 섞이지 않게 하려고 `TESTCONTAINERS_RYUK_DISABLED=true`로 Ryuk(남은 컨테이너를 치우는 보조 컨테이너)를 끄고 돌렸다. 이때는 테스트의 afterAll이 컨테이너를 정리한다. 테스트 프로세스가 중간에 죽으면 컨테이너가 남으므로 `docker ps`로 확인한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| 패키지 | pg 8.23.1, @types/pg 8.23.1, @testcontainers/postgresql 12.2.1(testcontainers 12.2.1) | 2026-10-26 |
| DB 이미지 | postgres:17-alpine (PostgreSQL 17.11) | 2026-10-26 |
| Docker | Docker Desktop 4.49.0, Engine 28.5.1 | 2026-10-26 |
| 컨테이너 준비 시간 | 2.0~2.6초(PC가 한가할 때, 실행 결과의 첫 실행 출력), 13.5~29.0초(다른 작업과 겹칠 때) | 2026-10-26 |
| count(*) 결과 타입 | bigint, node-postgres 기본 변환은 문자열 | 2026-10-26 |
| vitest hookTimeout 기본값 | 10초 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 리포지토리 패턴의 설계 | 42강 |
| 스키마 설계와 제약(기본 키, 유니크) | 61강, 63강 |
| ORM, 원시 SQL과 드라이버 타입 변환 | 66강, 67강 |
| 커넥션 풀 크기 | 70강 |
| 마이그레이션 도구 | 71강 |
| 좌석 선점의 동시성(조건부 UPDATE와 잠금) | 83강 |
| CI에서 통합 테스트 돌리기 | 257강 |
| 서버 여러 대와 상태 | 281강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

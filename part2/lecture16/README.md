# 16강. DTO와 엔티티

제2부 NestJS 핵심 · 4장 구성 요소

[← 15강](../../part2/lecture15/) | [제2부 목록](../) | [17강 →](../../part2/lecture17/)

## 이번 강의 질문

요청으로 들어오는 JSON, 서버가 가진 데이터, 응답으로 나가는 JSON을 왜 서로 다른 클래스로 나누나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 15강 끝 코드([../../part2/lecture15/code/](../../part2/lecture15/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다.

```bash
cd code
npm install
npx nest build
PORT=4016 node dist/apps/ticketing/main.js
```

Windows Git Bash에서는 한글 본문이 깨질 수 있어서 요청 본문을 파일로 만들어 보낸다.

```bash
printf '{"title":"가을 콘서트","venue":"올림픽홀"}' > c-ok.json
printf '{"title":12345}' > c-num.json
curl -X POST localhost:4016/concerts -H 'Content-Type: application/json' --data-binary @c-ok.json
curl localhost:4016/concerts
curl -X POST localhost:4016/concerts -H 'Content-Type: application/json' --data-binary @c-num.json
```

TypeScript가 DTO 클래스를 어떤 JavaScript로 바꾸는지는 따로 출력해 본다.

```bash
npx tsc -p apps/ticketing/tsconfig.app.json --outDir /tmp/tscout
cat /tmp/tscout/apps/ticketing/src/concerts/dto/create-concert.dto.js
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/concerts/entities/concert.entity.ts](code/apps/ticketing/src/concerts/entities/concert.entity.ts) | 공개 필드 `id`·`title`·`venue`에 내부 필드 `settlementRate`(정산 수수료율)·`createdAt` 추가 |
| [code/apps/ticketing/src/concerts/dto/create-concert.dto.ts](code/apps/ticketing/src/concerts/dto/create-concert.dto.ts) | 요청 DTO: `title`, `venue` |
| [code/apps/ticketing/src/concerts/dto/concert-response.dto.ts](code/apps/ticketing/src/concerts/dto/concert-response.dto.ts) | 응답 DTO: `id`, `title`, `venue`와 엔티티에서 필드를 골라 옮기는 `static from()` |
| [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | `create`가 요청 DTO의 필드를 하나씩 골라 엔티티를 만듦, `update`도 `title`·`venue`만 반영, `remove`는 확인 뒤 삭제 |
| [code/apps/ticketing/src/concerts/concerts.controller.ts](code/apps/ticketing/src/concerts/concerts.controller.ts) | 응답을 `ConcertResponseDto.from`으로 변환, `ParseIntPipe`, 삭제 `@HttpCode(204)` |
| [code/apps/ticketing/src/performances/dto/performance-response.dto.ts](code/apps/ticketing/src/performances/dto/performance-response.dto.ts), [code/apps/ticketing/src/performances/performances.controller.ts](code/apps/ticketing/src/performances/performances.controller.ts), [code/apps/ticketing/src/performances/performances.service.ts](code/apps/ticketing/src/performances/performances.service.ts) | 회차 응답 DTO(`id`, `concertId`, `startsAt`)와 적용 |
| [code/apps/ticketing/src/seats/dto/seat-response.dto.ts](code/apps/ticketing/src/seats/dto/seat-response.dto.ts), [code/apps/ticketing/src/seats/seats.controller.ts](code/apps/ticketing/src/seats/seats.controller.ts), [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | 좌석 응답 DTO. 엔티티에 없는 `label`을 `libs/common`의 `seatLabel`로 만들어 응답에 싣는다 |

`UpdateConcertDto`([code/apps/ticketing/src/concerts/dto/update-concert.dto.ts](code/apps/ticketing/src/concerts/dto/update-concert.dto.ts))는 스키매틱이 만든 `PartialType(CreateConcertDto)` 그대로다.

### 실행 결과

엔티티를 그대로 돌려주던 때의 공연 목록. 내부 필드인 정산 수수료율과 등록 시각이 고객 앱이 받는 JSON에 들어 있다.

```
$ curl localhost:4016/concerts
[{"id":1,"settlementRate":0.1,"createdAt":"2026-10-26T04:59:11.724Z","title":"가을 콘서트","venue":"올림픽홀"}]
```

응답 DTO로 바꾼 뒤.

```
$ curl localhost:4016/concerts
[{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}]
```

요청 본문을 스프레드로 엔티티에 그대로 붓던 때. 본문에 `settlementRate`와 `id`를 끼워 넣으면 수수료율이 0이 되고 id 1번이 둘 생긴다.

```
$ curl -X POST localhost:4016/concerts -d '{"title":"가을 콘서트","venue":"올림픽홀"}'
{"id":1,"settlementRate":0.1,"createdAt":"2026-10-26T04:59:11.724Z","title":"가을 콘서트","venue":"올림픽홀"}

$ curl -X POST localhost:4016/concerts -d '{"title":"겨울 콘서트","venue":"KSPO DOME","settlementRate":0,"id":1}'
{"id":1,"settlementRate":0,"createdAt":"2026-10-26T04:59:11.757Z","title":"겨울 콘서트","venue":"KSPO DOME"}
```

```
$ curl localhost:4016/concerts
[{"id":1,"settlementRate":0.1,...,"title":"가을 콘서트","venue":"올림픽홀"},
 {"id":1,"settlementRate":0,...,"title":"겨울 콘서트","venue":"KSPO DOME"},
 {"id":3,"settlementRate":0.1,...,"title":12345}]

$ curl localhost:4016/concerts/1
{"id":1,"settlementRate":0.1,...,"title":"가을 콘서트","venue":"올림픽홀"}
```

두 번째로 등록한 공연은 id가 1로 덮여서 조회할 수 없다.

필드를 골라 옮기도록 고친 뒤 같은 본문을 보낸 결과.

```
$ curl -X POST localhost:4016/concerts -d '{"title":"겨울 콘서트","venue":"KSPO DOME","settlementRate":0,"id":1}'
{"id":2,"title":"겨울 콘서트","venue":"KSPO DOME"}
```

`tsc`가 출력한 DTO. 필드 이름만 남고 타입은 사라진다(target ES2023).

```js
// tsc 출력: create-concert.dto.js
export class CreateConcertDto {
    title;
    venue;
}
```

`@Body()`로 받은 값은 JSON을 파싱한 일반 객체다. `CreateConcertDto` 인스턴스가 아니고, 타입 표시와 다른 값도 그대로 들어온다.

```
$ curl -X POST localhost:4016/concerts -d '{"title":12345}'
false number
```

```
$ curl -X POST localhost:4016/concerts -d '{"title":12345}'
{"id":3,"title":12345}
```

PATCH 본문에 수수료율을 끼워 넣어도 `update`가 `title`·`venue`만 반영해 `settlementRate`는 0.1 그대로다.

```
$ curl -X PATCH localhost:4016/concerts/1 -d '{"venue":"KSPO DOME","settlementRate":0.5}'
{"id":1,"title":"가을 콘서트","venue":"KSPO DOME"}
```

좌석 응답 DTO.

```
$ curl -X POST localhost:4016/performances/1/seats/A-3-15/hold
{"id":"A-3-15","label":"A구역 3열 15번","status":"HELD"}
```

### 해 볼 때 참고

- 엔티티 노출: 공연 컨트롤러에서 `ConcertResponseDto.from` 변환을 빼고 서비스의 반환값을 그대로 return하면 첫 출력처럼 내부 필드가 응답에 섞인다
- 대량 할당: 서비스 `create`에서 기본값(`id`, `settlementRate`, `createdAt`) 뒤에 요청 DTO를 스프레드로 펼쳐 엔티티를 만들면, 요청에 온 필드 전부가 기본값을 덮어쓴다. 클라이언트가 바꾸면 안 되는 필드는 요청 DTO에 없어도 본문에 실어 보낼 수 있다는 점이 핵심이다
- `instanceof` 확인은 컨트롤러 `create`에 `console.log(createConcertDto instanceof CreateConcertDto, typeof createConcertDto.title);`를 잠깐 넣어 본 것이다. 확인한 뒤 지운다
- 지금 코드는 모르는 필드를 서비스에서 골라 옮겨 무시할 뿐, 필드 타입은 검사하지 않는다. 숫자 제목이 그대로 저장되는 것도 그래서다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0, @nestjs/mapped-types 12.0.0 | 2026-10-26 |
| TypeScript | 6.0.3 (tsc 출력 JS의 필드 선언 모양은 target ES2023 기준) | 2026-10-26 |
| GitHub 대량 할당 사건 | 2012-03-04, Rails 앱의 공개 키 갱신 폼, 한 사용자가 rails 저장소에 파일을 올림 | 2012-03-04 |
| OWASP API Security Top 10 | 2023년 버전 API3:2023 Broken Object Property Level Authorization (과다 노출과 대량 할당을 묶은 항목) | 2023 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| ValidationPipe, class-validator, whitelist | [25강](../../part2/lecture25/) |
| 매핑된 타입(PartialType·PickType·OmitType) | [25강](../../part2/lecture25/) |
| ClassSerializerInterceptor로 필드 감추기 | [28강](../../part2/lecture28/) |
| ORM 엔티티와 테이블 | 66강 |
| 마이그레이션과 컬럼 이름 변경 | 71강, 72강 |
| 입력 유효성 검사와 보안 | 153강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

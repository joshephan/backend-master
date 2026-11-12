# 13강. 모듈: 경계를 긋는 단위

제2부 NestJS 핵심 · 4장 구성 요소

[← 12강](../../part1/lecture12/) | [제2부 목록](../) | [14강 →](../../part2/lecture14/)

## 이번 강의 질문

클래스는 다 만들어 뒀는데 Nest는 왜 "찾을 수 없다"고 하고, 어떤 클래스를 어디까지 보이게 할지는 무엇이 정하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 12강 끝 코드([../../part1/lecture12/code/](../../part1/lecture12/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 회차 리소스는 Nest CLI로 만들었다. 모노레포라서 `--project`로 앱을 지정한다(빼면 어느 앱에 만들지 묻는다).

```bash
nest g resource performances --project ticketing --type rest --crud --no-spec
git diff apps/ticketing/src/app.module.ts
```

실행:

```bash
cd code
npm install
npx nest build
PORT=4013 node dist/apps/ticketing/main.js
```

Windows Git Bash에서는 curl 명령줄의 한글 본문이 깨질 수 있어서 본문을 파일로 만들어 보낸다.

```bash
printf '{"title":"가을 콘서트"}' > concert.json
printf '{"concertId":1,"startsAt":"2026-11-14T19:00"}' > perf1.json
curl -X POST localhost:4013/concerts -H 'Content-Type: application/json' --data-binary @concert.json
curl localhost:4013/concerts
curl -X POST localhost:4013/performances -H 'Content-Type: application/json' --data-binary @perf1.json
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/performances/performances.module.ts](code/apps/ticketing/src/performances/performances.module.ts) | `imports: [ConcertsModule]`, providers에는 `PerformancesService`만 |
| [code/apps/ticketing/src/performances/performances.service.ts](code/apps/ticketing/src/performances/performances.service.ts) | 생성자로 `ConcertsService`를 받아 회차 등록 전에 공연이 있는지 확인. 회차는 서비스 안 배열에 저장 |
| [code/apps/ticketing/src/performances/performances.controller.ts](code/apps/ticketing/src/performances/performances.controller.ts) | 스키매틱이 만든 CRUD 컨트롤러 |
| [code/apps/ticketing/src/performances/entities/performance.entity.ts](code/apps/ticketing/src/performances/entities/performance.entity.ts) | `id`, `concertId`, `startsAt` |
| [code/apps/ticketing/src/performances/dto/create-performance.dto.ts](code/apps/ticketing/src/performances/dto/create-performance.dto.ts), [code/apps/ticketing/src/performances/dto/update-performance.dto.ts](code/apps/ticketing/src/performances/dto/update-performance.dto.ts) | 회차 등록·수정 DTO |
| [code/apps/ticketing/src/concerts/concerts.module.ts](code/apps/ticketing/src/concerts/concerts.module.ts) | `exports: [ConcertsService]` |
| [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | 고정된 '10월 콘서트' 대신 등록한 공연을 배열에 저장, 인스턴스 수를 보는 생성자 로그 |
| [code/apps/ticketing/src/concerts/entities/concert.entity.ts](code/apps/ticketing/src/concerts/entities/concert.entity.ts), [code/apps/ticketing/src/concerts/dto/create-concert.dto.ts](code/apps/ticketing/src/concerts/dto/create-concert.dto.ts) | 공연 엔티티(`id`, `title`)와 등록 DTO(`title`) |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | 스키매틱이 imports에 `PerformancesModule` 추가 |

### 실행 결과

스키매틱 출력.

```
$ nest g resource performances --project ticketing --type rest --crud --no-spec
CREATE apps/ticketing/src/performances/performances.controller.ts (1084 bytes)
CREATE apps/ticketing/src/performances/performances.module.ts (312 bytes)
CREATE apps/ticketing/src/performances/performances.service.ts (739 bytes)
CREATE apps/ticketing/src/performances/dto/create-performance.dto.ts (38 bytes)
CREATE apps/ticketing/src/performances/dto/update-performance.dto.ts (204 bytes)
CREATE apps/ticketing/src/performances/entities/performance.entity.ts (29 bytes)
UPDATE apps/ticketing/src/app.module.ts (439 bytes)
```

모듈 설정에 따른 결과.

| PerformancesModule | ConcertsModule | 결과 |
|---|---|---|
| imports 없음, providers [PerformancesService] | exports 없음 | 부팅 에러 (can't resolve dependencies) |
| providers [PerformancesService, ConcertsService] | exports 없음 | 부팅 성공, 생성 로그 두 번, 회차 등록 404 |
| imports [ConcertsModule] | exports 없음 | 부팅 에러 (같은 문구) |
| imports [ConcertsModule] | exports [ConcertsService] | 부팅 성공, 생성 로그 한 번, 회차 등록 201 |

imports도 providers 추가도 없을 때의 부팅 에러.

```
$ node dist/apps/ticketing/main.js
LOG [NestFactory] Starting Nest application...
ERROR [ExceptionHandler] UnknownDependenciesException [Error]:
Nest can't resolve dependencies of the PerformancesService (?).
Please make sure that the argument ConcertsService at index [0]
is available in the PerformancesModule module.

Potential solutions:
- Is PerformancesModule a valid NestJS module?
- If ConcertsService is a provider, is it part of the current PerformancesModule?
- If ConcertsService is exported from a separate @Module, is that module
  imported within PerformancesModule?
```

`PerformancesModule`의 providers에 `ConcertsService`를 한 번 더 적었을 때. 생성 로그가 두 번 찍히고, 공연을 등록해도 회차 쪽은 빈 배열을 본다. 요청 헤더(`Content-Type: application/json`)는 줄여 적었다.

```
LOG [NestFactory] Starting Nest application...
ConcertsService 생성
ConcertsService 생성
LOG [InstanceLoader] AppModule dependencies initialized +28ms
LOG [InstanceLoader] PerformancesModule dependencies initialized +0ms
LOG [InstanceLoader] ConcertsModule dependencies initialized +0ms
...
LOG [NestApplication] Nest application successfully started +1ms
```

```
$ curl -X POST localhost:4013/concerts -d '{"title":"가을 콘서트"}'
{"id":1,"title":"가을 콘서트"}

$ curl localhost:4013/concerts
[{"id":1,"title":"가을 콘서트"}]

$ curl -X POST localhost:4013/performances -d '{"concertId":1,"startsAt":"2026-11-14T19:00"}'
{"type":"about:blank","title":"Not Found","status":404,"detail":"공연 1번이 없습니다","instance":"/performances"}
```

imports에 `ConcertsModule`만 넣고 exports가 없을 때.

```
ConcertsService 생성
ERROR [ExceptionHandler] UnknownDependenciesException [Error]:
Nest can't resolve dependencies of the PerformancesService (?).
```

exports까지 넣은 뒤(이 강 끝 코드). 생성 로그가 한 번이고 공연 API와 회차 서비스가 같은 인스턴스를 쓴다.

```
ConcertsService 생성
LOG [NestApplication] Nest application successfully started

$ curl -X POST localhost:4013/concerts -d '{"title":"가을 콘서트"}'
{"id":1,"title":"가을 콘서트"}
$ curl -X POST localhost:4013/performances -d '{"concertId":1,"startsAt":"2026-11-14T19:00"}'
{"id":1,"concertId":1,"startsAt":"2026-11-14T19:00"}
$ curl -X POST localhost:4013/performances -d '{"concertId":9,"startsAt":"2026-11-14T19:00"}'
{"type":"about:blank","title":"Not Found","status":404,"detail":"공연 9번이 없습니다","instance":"/performances"}
```

두 모듈이 서로를 imports하면 빌드는 통과하고 부팅에서 멈춘다.

```
// ConcertsModule imports: [PerformancesModule]
// PerformancesModule imports: [ConcertsModule]
$ nest build
Rspack 2.2.9 compiled successfully in 30 ms
$ node dist/apps/ticketing/main.js
ReferenceError: Cannot access 'ConcertsModule' before initialization
```

### 해 볼 때 참고

- 위 표의 나쁜 설정은 `performances.module.ts`와 `concerts.module.ts` 두 파일만 바꿔 재현한다. 첫째 줄은 `performances.module.ts`의 `imports`와 `concerts.module.ts`의 `exports`를 지운 상태다. 둘째 줄은 거기서 providers를 `[PerformancesService, ConcertsService]`로 바꾼 것이다(`ConcertsService` import 줄 필요). 셋째 줄은 첫째 줄에서 `imports: [ConcertsModule]`만 되살린 것이다
- 다른 모듈의 providers에 서비스를 다시 적으면 부팅은 되지만 인스턴스가 둘이 된다. 서비스가 값(캐시, 카운터, 연결 객체)을 갖고 있을 때만 증상이 보여서 늦게 발견된다
- 자기 providers에 없는 서비스를 exports에 넣으면 `UnknownExportException`("Nest cannot export a provider/module that is not a part of the currently processed module")으로 부팅이 멈춘다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0, @nestjs/cli 12.0.10 | 2026-10-26 |
| 부팅 에러 문구 | "Nest can't resolve dependencies of the PerformancesService (?). Please make sure that the argument ConcertsService at index [0] is available in the PerformancesModule module." 와 Potential solutions 세 줄 | 2026-10-26 |
| 생성 파일 크기 | nest g resource 출력의 bytes 값 | 2026-10-26 |
| Node | v24.11.0 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 의존성 주입의 원리 | [17강](../../part2/lecture17/) |
| 글로벌 모듈, 동적 모듈 | [20강](../../part2/lecture20/) |
| 순환 의존과 forwardRef | [21강](../../part2/lecture21/) |
| 예외와 에러 응답 형식 | [27강](../../part2/lecture27/) |
| 회차·공연의 DB 저장 | 66강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

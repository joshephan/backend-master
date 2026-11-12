# 22강. 요청 파이프라인의 실행 순서

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 21강](../../part2/lecture21/) | [제2부 목록](../) | [23강 →](../../part2/lecture23/)

## 이번 강의 질문

요청 하나가 핸들러에 닿기 전과 응답이 나가기 전에 Nest 안에서 무엇을 어떤 순서로 지나고, 그 순서를 잘못 알면 무엇이 틀어지나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 21강 끝 코드([../../part2/lecture21/code/](../../part2/lecture21/code/)). 서버는 code/ 안의 `.env`를 읽으므로 [20강 실습 자료](../../part2/lecture20/)와 같은 내용으로 만든다
- 이 강의 [code/](code/)는 관문마다 번호를 찍는 추적 모듈 세 파일뿐이다. 21강 끝 코드의 `apps/ticketing/src/trace/`에 복사하고, `apps/ticketing/src/app.module.ts`의 imports에 `TraceModule`을 더한다(`import { TraceModule } from './trace/trace.module.js';`)
- 추적 모듈은 실행 순서를 보려고 잠깐 얹는 코드라 이후 프로젝트 코드에는 들어가지 않는다
- 아래 명령은 bash 기준이다

```bash
npm install
npx nest build
PORT=4022 PAYMENT_MODE=fake node dist/apps/ticketing/main.js
```

다른 터미널에서 다섯 가지 요청을 보낸다.

```bash
curl localhost:4022/trace/7
curl localhost:4022/trace/abc
curl localhost:4022/trace/0
curl localhost:4022/nope
curl -H 'x-block: guard' localhost:4022/trace/7
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/trace/trace.ts](code/apps/ticketing/src/trace/trace.ts) | 관문마다 번호를 찍는 미들웨어(1), 가드(2, `x-block: guard` 헤더면 거절), 컨트롤러 인터셉터(3, 6), 메서드 인터셉터(3b, 6a), 파이프(4), 예외 필터(7). 예외 필터는 찍은 뒤 기존 `ProblemDetailsFilter`에 넘긴다 |
| [code/apps/ticketing/src/trace/trace.controller.ts](code/apps/ticketing/src/trace/trace.controller.ts) | `GET /trace/:id`. 컨트롤러에 가드·인터셉터·필터, 메서드에 인터셉터, 인자에 `TracePipe`와 `ParseIntPipe`. id가 0이면 예외를 던진다 |
| [code/apps/ticketing/src/trace/trace.module.ts](code/apps/ticketing/src/trace/trace.module.ts) | 컨트롤러를 등록하고 미들웨어를 모든 경로(`*path`)에 건다 |

### 실행 결과

`curl localhost:4022/trace/7`. 정상 요청은 들어갈 때 미들웨어, 가드, 인터셉터, 파이프 순서로 지나 핸들러에 닿고, 나올 때 안쪽 인터셉터부터 끝난다. 가드가 본 `params.id`는 파이프 전이라 문자열이다.

```text
{"id":7}

1 미들웨어 GET /trace/7
2 가드 (params.id: string "7")
3 인터셉터 (앞)
3b 메서드 인터셉터 (앞)
4 파이프 (param id=7)
5 핸들러 id=7
6a 메서드 인터셉터 (뒤)
6 인터셉터 (뒤)
```

`curl -H 'x-block: guard' localhost:4022/trace/7`. 가드가 false를 돌려주면 Nest가 `ForbiddenException`을 던진다.

```text
{"type":"about:blank","title":"Forbidden","status":403,
 "detail":"Forbidden resource","instance":"/trace/7"}

1 미들웨어 GET /trace/7
2 가드 (params.id: string "7")
7 예외 필터 (ForbiddenException)
```

`curl localhost:4022/trace/abc`. `ParseIntPipe`에서 실패한다.

```text
{"type":"about:blank","title":"Bad Request","status":400,
 "detail":"Validation failed (numeric string is expected)",
 "instance":"/trace/abc"}

1 미들웨어 GET /trace/abc
2 가드 (params.id: string "abc")
3 인터셉터 (앞)
3b 메서드 인터셉터 (앞)
4 파이프 (param id=abc)
7 예외 필터 (BadRequestException)
```

`curl localhost:4022/trace/0`. 핸들러가 예외를 던진다.

```text
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.","instance":"/trace/0"}

1 미들웨어 GET /trace/0
2 가드 (params.id: string "0")
3 인터셉터 (앞)
3b 메서드 인터셉터 (앞)
4 파이프 (param id=0)
5 핸들러 id=0
7 예외 필터 (Error)
ERROR [ProblemDetails] Error: 핸들러에서 터짐
```

`curl localhost:4022/nope`. 라우트를 찾지 못해 미들웨어 다음 관문이 없고, 404 응답은 전역 `ProblemDetailsFilter`가 만든다.

```text
{"type":"about:blank","title":"Not Found","status":404,
 "detail":"Cannot GET /nope","instance":"/nope"}

1 미들웨어 GET /nope
```

| 요청 | 마지막으로 찍힌 관문 | 응답 |
|---|---|---|
| x-block: guard | 2 가드 | 403 |
| /trace/abc | 4 파이프 | 400 |
| /trace/0 | 5 핸들러 | 500 |
| /nope | 1 미들웨어 | 404 |

### 해 볼 때 참고

- 예외가 나면 인터셉터의 뒤쪽 줄(6a, 6)은 찍히지 않는다. 인터셉터의 뒤쪽 코드는 핸들러가 값을 돌려줄 때만 실행된다
- `@Param('id', TracePipe, ParseIntPipe)`의 순서를 바꿔 `ParseIntPipe`를 앞에 두면 `TracePipe`가 숫자 7을 받는다. 파이프는 적은 순서대로 실행된다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0 | 2026-10-26 |
| Express | 5.3.0 | 2026-10-26 |
| 공식 문서 Overview 목차 | First steps, Controllers, Providers, Modules, Middleware, Exception filters, Pipes, Guards, Interceptors, Custom decorators | 2026-10-26 |
| 실행 환경 | Windows, Node v24.11.0, 빌더 rspack 2.2.9 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 미들웨어 작성과 적용 범위 | [23강](../../part2/lecture23/) |
| 가드와 실행 컨텍스트 | [24강](../../part2/lecture24/) |
| ValidationPipe와 DTO 검증 | [25강](../../part2/lecture25/) |
| 인터셉터에서 응답과 에러 바꾸기 | [26강](../../part2/lecture26/) |
| 예외 필터의 범위와 고르는 규칙 | [27강](../../part2/lecture27/) |
| 관문이 읽는 표시(메타데이터) | [28강](../../part2/lecture28/) |
| 응답 래핑과 API 응답 규격 | 49강 |
| 매크로 차단 | 159강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

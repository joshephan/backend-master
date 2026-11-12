# 1강. 요청 하나의 일생

제1부 기반: 백엔드와 Node.js 런타임 · 1장 오리엔테이션

[제1부 목록](../) | [2강 →](../../part1/lecture2/)

## 이번 강의 질문

버튼 한 번에 떠난 요청은 응답이 오기까지 어디를 거치고, 어디서 멈출 수 있나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |
| [subtitles-full.vtt](subtitles-full.vtt) | 강의 소개를 앞에 붙인 영상용 자막(VTT) |
| [subtitles-full.srt](subtitles-full.srt) | 강의 소개를 앞에 붙인 영상용 자막(SRT) |

## 실습 자료

### 준비

- Node 24(내장 `fetch`가 있는 Node 18 이상이면 된다). Node 내장 모듈만 쓰므로 설치할 패키지가 없다
- curl
- [code/](code/)의 파일 넷을 한 폴더에 두고 그 폴더에서 실행한다

```bash
node server.js &
node fake-pg.js &
node order.js &
FMT='dns=%{time_namelookup} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total} code=%{http_code}\n'
curl -s -o /dev/null -w "$FMT" https://example.com/
curl -s -o /dev/null -w "$FMT" https://example.com/
curl -s -o /dev/null -w "$FMT" http://localhost:3000/
curl -s -m 5 -o /dev/null -w "code=%{http_code} total=%{time_total}\n" -X POST http://localhost:3001/order
```

마지막 curl을 보낸 뒤 15초쯤 기다리며 `order.js` 로그에 `결제 대기 중 1개`가 계속 찍히는지 본다.

### 코드

| 파일 | 내용 |
|---|---|
| [code/server.js](code/server.js) | localhost 구간 시간을 재는 3000번 포트 서버. `ok`만 돌려준다 |
| [code/fake-pg.js](code/fake-pg.js) | 요청을 받기만 하고 끝내 답하지 않는 가짜 결제사(4000번 포트) |
| [code/order.js](code/order.js) | 주문이 오면 내장 `fetch`로 가짜 결제사를 부르는 주문 서버(3001번 포트). 5초마다 결제 대기 중인 요청 수를 찍는다 |
| [code/fetch-wait.js](code/fetch-wait.js) | 답하지 않는 결제사를 내장 `fetch`가 얼마나 기다리는지 재는 코드(4100번 포트로 요청) |

### 실행 결과

위 curl 네 번의 출력(2026-10-25). 첫 줄과 둘째 줄은 example.com 첫 요청과 바로 다음 요청, 셋째 줄은 localhost, 넷째 줄은 5초 제한을 건 주문 요청이다.

```text
dns=0.247680 connect=0.497700 tls=0.742791 ttfb=0.976962 total=0.977216 code=200
dns=0.018171 connect=0.246440 tls=0.485974 ttfb=0.718489 total=0.718545 code=200
dns=0.000103 connect=0.002870 tls=0.000000 ttfb=0.012293 total=0.012352 code=200
code=000 total=5.007149
```

주문 요청의 curl은 5초 뒤 시간 초과(exit 28)로 떠났고, 주문 서버 로그는 그 뒤에도 결제사 응답을 기다린다.

```text
order api on 3001
주문 받음, 결제 대기 중인 요청 1개
[03:21:37] 결제 대기 중 1개
[03:21:42] 결제 대기 중 1개
[03:21:47] 결제 대기 중 1개
```

`fetch-wait.js`의 출력. 응답 헤더가 오지 않아 303초 뒤에 포기했다.

```text
실패 303초 뒤: UND_ERR_HEADERS_TIMEOUT
```

### 해 볼 때 참고

- `fetch-wait.js`는 4100번 포트를 부른다. `fake-pg.js`의 포트 4000을 4100으로 바꾼 사본을 하나 더 띄운 뒤 실행한다. 결과가 나오기까지 5분 넘게 걸린다
- 구간 시간은 네트워크와 지역에 따라 다르다. 같은 주소를 바로 이어서 부르면 DNS 시간이 줄어드는 것을 볼 수 있다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| example.com 구간 시간(첫 요청) | dns 0.248 / connect 0.498 / tls 0.743 / ttfb 0.977 / total 0.977초 | 2026-10-25 |
| example.com 구간 시간(바로 다음 요청) | dns 0.018 / connect 0.246 / tls 0.486 / ttfb 0.718초 | 2026-10-25 |
| localhost 구간 시간 | dns 0.0001 / connect 0.003 / ttfb 0.012초 | 2026-10-25 |
| Node 내장 fetch 응답 헤더 기본 대기 | 300초(실측 303초 뒤 UND_ERR_HEADERS_TIMEOUT) | 2026-10-25 |
| 커넥션 풀 10개, 쿼리 20밀리초, 결제사 0.5초 | 계산용 가정값 | - |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 이벤트 루프 동작 | [4강](../../part1/lecture4/), [5강](../../part1/lecture5/), [6강](../../part1/lecture6/) |
| 요청 파이프라인 각 관문 | [22강](../../part2/lecture22/), [23강](../../part2/lecture23/), [24강](../../part2/lecture24/), [25강](../../part2/lecture25/), [26강](../../part2/lecture26/), [27강](../../part2/lecture27/), [28강](../../part2/lecture28/) |
| HTTP 연결 재사용 | [10강](../../part1/lecture10/) |
| 커넥션 풀 설정과 한도 | 70강 |
| 타임아웃 설계 | 210강 |
| 응답을 모르는 결제의 처리 | 214강 |
| 동시에 쓰는 쿠폰 | [8강](../../part1/lecture8/) |
| 읽기 복제본의 지연 | 110강 |
| TLS, 로드 밸런서 | 165강, 282~284강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

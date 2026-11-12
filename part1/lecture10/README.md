# 10강. 연결 재사용, Keep-Alive, 압축

제1부 기반: 백엔드와 Node.js 런타임 · 3장 HTTP 기초

[← 9강](../../part1/lecture9/) | [제1부 목록](../) | [11강 →](../../part1/lecture11/)

## 이번 강의 질문

같은 서버에 요청을 계속 보낼 때, 매번 새로 접속하는 비용과 매번 전부 보내는 비용을 어떻게 줄이고, 그 대가로 무엇을 맞춰야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 9강 끝 코드([../../part1/lecture9/code/](../../part1/lecture9/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 이 강에서 `compression` 패키지를 더했다(`npm install compression @types/compression`).

```bash
cd code
npm install
npx nest build
PORT=4010 node dist/apps/ticketing/main.js
```

압축 크기는 `Accept-Encoding`을 바꿔 가며 받은 바이트 수로 본다.

```bash
for e in identity gzip br; do
  curl -s -o /dev/null -H "Accept-Encoding: $e" -w "$e %{size_download}\n" localhost:4010/performances/1/seats
done
curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip, br' localhost:4010/concerts/1
```

결제사 연결 수와 keepAliveTimeout 실험은 프로젝트 밖의 순수 Node 스크립트로 했다. 그 스크립트들은 code/에 들어 있지 않다. 핵심 부분은 아래 "해 볼 때 참고"에 있다.

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `app.use(compression())`, `server.keepAliveTimeout = 65_000`(로드 밸런서 유휴 시간 60초보다 길게) |
| [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | 5만 석 좌석 지도를 만드는 `buildSeatMap()`(20구역 x 50열 x 50석, 판매 여부는 고정 시드)과 `seats()` |
| [code/apps/ticketing/src/concerts/holds.controller.ts](code/apps/ticketing/src/concerts/holds.controller.ts) | `GET /performances/:performanceId/seats` |
| [code/package.json](code/package.json) | `compression`, `@types/compression` 추가 |

### 실행 결과

같은 연결로 두 번 요청. 두 요청 모두 연결 #0을 쓴다.

```
$ curl -sv localhost:4010/concerts/1 localhost:4010/concerts/1 -o /dev/null -o /dev/null
* Connection #0 to host localhost:4010 left intact
* Connection #0 to host localhost:4010 left intact
```

가짜 HTTPS 결제사에 200건을 차례로 보낸 결과(같은 PC 안, 3회씩).

| 부르는 방식 | 200건 걸린 시간 | 새 연결 |
|---|---|---|
| 요청마다 new https.Agent() | 466~534ms | 200개 |
| Agent 하나 재사용 (keepAlive: true) | 94~199ms | 2개 |
| fetch | 235~268ms | 2개 |

서버가 빈 연결을 닫는 시각. 헤더로 알리는 시간은 keepAliveTimeout이고, 실제로는 keepAliveTimeoutBuffer(1초)만큼 더 기다렸다 닫는다.

```
$ node ka-close.mjs
keepAliveTimeout 5000 buffer 1000
응답 헤더 Keep-Alive: timeout=5
서버가 연결을 닫음: 응답 6013ms 뒤

$ node ka-close.mjs 1000
keepAliveTimeout 1000 buffer 1000
응답 헤더 Keep-Alive: timeout=1
서버가 연결을 닫음: 응답 2008ms 뒤
```

연결이 닫히는 순간의 요청. 서버 keepAliveTimeout 1초(실제 닫힘 약 2초)에서 같은 연결로 두 번째 요청을 보낸 결과(시각마다 20회).

| 두 번째 요청을 보낸 시각 | 20번 시도 결과 |
|---|---|
| 1,500ms | 20번 모두 응답 |
| 1,990ms | 응답 12, ECONNRESET 8 |
| 1,995ms | ECONNRESET 20 |
| 2,000ms | ECONNRESET 20 |
| 2,005ms | ECONNRESET 12, 닫힘 확인 8 |
| 2,500ms | 20번 모두 닫힘 확인 |

keepAliveTimeout을 65초로 바꾼 뒤의 응답 헤더.

```
$ curl -s -D - -o /dev/null localhost:4010/concerts/1
Connection: keep-alive
Keep-Alive: timeout=65
```

좌석 지도의 압축 전 크기.

```
$ curl -s -o /dev/null -w "%{size_download} bytes\n" localhost:4010/performances/1/seats
3189541 bytes
```

compression 적용 뒤 `Accept-Encoding`별 받은 크기. 전송 시간은 10Mbps를 가정해 계산한 값이다.

| Accept-Encoding | 받은 크기 | 10Mbps에서 전송 시간 |
|---|---|---|
| (없음) | 3,189,541 bytes | 약 2.6초 |
| gzip | 295,815 bytes (9.3%) | 약 0.24초 |
| br | 178,490 bytes (5.6%) | 약 0.14초 |

같은 PC 안에서 잰 응답 시간은 압축 없음 15~22ms, gzip 37~41ms, br 22~25ms였다.

작은 응답은 압축하지 않는다. compression의 기본 기준은 1KB다.

```
$ curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip, br' localhost:4010/concerts/1
HTTP/1.1 200 OK
Content-Length: 34
Vary: Accept-Encoding
```

zlib로 3MB 좌석 지도를 직접 압축한 시간(5회씩).

| 방식 | 압축 뒤 크기 | 3MB 한 번 압축 시간 |
|---|---|---|
| gzip 기본(6) | 289KB | 22~26ms |
| brotli 품질 4 | 174KB | 13~15ms |
| brotli 기본 품질(11) | 135KB | 2,745~3,319ms |

이미 압축된 데이터는 다시 압축해도 줄지 않는다.

```
이미 압축된 데이터(무작위 500KB) gzip: 512000 → 512178 bytes
```

### 해 볼 때 참고

- 가짜 결제사는 HTTPS 서버(포트 5010)로, 처음 보는 소켓으로 온 요청만 센다. 자체 서명 인증서는 `openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 30 -subj "/CN=localhost"`로 만든다

```js
// fake-pg.mjs의 핵심 부분
const seen = new WeakSet();
const server = https.createServer({ key, cert }, (req, res) => {
  if (!seen.has(req.socket)) { seen.add(req.socket); connections++; }
  res.end(JSON.stringify({ approved: true }));
});
```

- 요청마다 새 Agent를 만드는 나쁜 예. `new https.Agent()`의 keepAlive 기본값은 false라서 200건이면 연결도 200개가 생긴다. Agent를 모듈에서 한 번만 `new https.Agent({ keepAlive: true })`로 만들어 넘기면 연결이 2개로 준다. 자체 서명 인증서라서 로컬에서는 요청 옵션에 `rejectUnauthorized: false`를 넣었다. 운영 코드에는 넣지 않는다

```js
function pay(body) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { host: 'localhost', port: 5010, path: '/pay', method: 'POST',
        agent: new https.Agent() },   // 요청마다 새로
      (res) => { res.resume(); res.on('end', resolve); },
    );
    req.on('error', reject);
    req.end(body);
  });
}
```

- 닫힘 시각 실험은 `http.createServer`의 `keepAliveTimeout`을 인자로 바꾸고, `net.connect`로 요청 하나를 보낸 뒤 `'end'` 이벤트까지 시간을 잰 것이다. 경합 실험은 keepAliveTimeout 1000으로 두고 같은 연결로 1500, 1990, 1995, 2000, 2005, 2500ms 뒤에 두 번째 요청을 보낸 것이다
- 운영에서 볼 숫자: 결제사로 나가는 새 연결 수(요청 수만큼 늘면 Agent를 매번 만드는 것), 로드 밸런서의 502(앱 로그에 짝이 없는 502가 새벽에 몇 건씩), 응답 크기·응답 시간·CPU

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node | v24.11.0 | 2026-10-26 |
| Node HTTP 서버 기본값 | keepAliveTimeout 5000ms, keepAliveTimeoutBuffer 1000ms, headersTimeout 60000ms | 2026-10-26 |
| 실제 닫힘 시각 | 기본 설정 6013ms, keepAliveTimeout 1000일 때 2008ms | 2026-10-26 |
| new http.Agent() keepAlive | false | 2026-10-26 |
| globalAgent keepAlive | true (Node 19부터) | 2026-10-26 |
| 결제사 200건 | 새 Agent 466~534ms·연결 200개, 공유 Agent 94~199ms·연결 2개, fetch 235~268ms·연결 2개 | 2026-10-26 |
| 연결 리셋 경합 | 1,990ms에서 응답 12·ECONNRESET 8, 1,995~2,000ms 전부 ECONNRESET(실습 자료의 실행 결과 참고) | 2026-10-26 |
| nginx 업스트림 keepalive_timeout 기본값 | 60초(nginx 1.15.3부터 있는 지시어) | 2026-10-26 |
| ALB 유휴 시간 기본값 | 60초, 앱 유휴 시간을 로드 밸런서보다 길게 권장 | 2026-10-26 |
| 좌석 지도 압축 | 원본 3,189,541 / gzip 295,815 / br 178,490 bytes | 2026-10-26 |
| 압축 시간 (zlib 직접) | gzip 6 22~26ms, brotli 4 13~15ms, brotli 11 2,745~3,319ms | 2026-10-26 |
| compression | 1.8.2, brotli 품질 4, 기준 1KB | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| DB 커넥션 풀 | 70강 |
| HTTP/2 멀티플렉싱 | 228강 |
| HTTP/3와 QUIC | 229강 |
| TIME_WAIT, 커넥션 리셋 자세히 | 233강 |
| 로드 밸런서 구성과 위치 | 282~284강 |
| CDN 압축, 엣지 | 134강 |
| TLS 핸드셰이크 내부 | 165강 |
| 타임아웃 설계 | 210강 |
| 미들웨어 | [23강](../../part2/lecture23/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

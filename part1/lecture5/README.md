# 5강. 비동기 I/O의 밑바닥: 스레드 풀, epoll, io_uring

제1부 기반: 백엔드와 Node.js 런타임 · 2장 이벤트 루프와 비동기 I/O

[← 4강](../../part1/lecture4/) | [제1부 목록](../) | [6강 →](../../part1/lecture6/)

## 이번 강의 질문

이벤트 루프가 기다리지 않는 동안, 실제로 기다리는 건 누구인가.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 22 이상. Node 내장 모듈만 쓰므로 설치할 패키지가 없다
- `pool.mjs`, `dns.mjs`는 어느 운영체제에서나 돌아간다. `epoll-server.mjs`, `uring3.mjs`는 `/proc`와 리눅스 커널 기능을 쓰므로 리눅스(WSL 포함)에서 돌린다
- [code/](code/)의 파일을 한 폴더에 두고 그 폴더에서 실행한다

스레드 풀 크기와 해시:

```bash
node pool.mjs 8
UV_THREADPOOL_SIZE=8 node pool.mjs 8
node dns.mjs 0; node dns.mjs 4; node dns.mjs 8; UV_THREADPOOL_SIZE=8 node dns.mjs 4
```

epoll이 지켜보는 소켓(리눅스, 서버 포트 5005):

```bash
node epoll-server.mjs & sleep 2; node epoll-client.mjs; wait
```

io_uring 설정별 파일 읽기(리눅스):

```bash
head -c 4096 /dev/urandom > /tmp/u3-data
node uring3.mjs
UV_USE_IO_URING=0 node uring3.mjs
UV_USE_IO_URING=1 node uring3.mjs
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/pool.mjs](code/pool.mjs) | 200만 회짜리 pbkdf2 n개를 동시에 걸고 각각 끝난 시각과 전체 시간을 찍는다 |
| [code/dns.mjs](code/dns.mjs) | 해시 n개를 건 상태에서 `dns.lookup`과 `readFile`이 얼마나 늦어지는지 잰다 |
| [code/epoll-server.mjs](code/epoll-server.mjs) | 5005번 포트 TCP 서버. `/proc/self/fdinfo`에서 이벤트 루프의 epoll이 지켜보는 소켓 수를 찍는다 |
| [code/epoll-client.mjs](code/epoll-client.mjs) | 5005번 포트에 연결 셋을 여는 클라이언트 |
| [code/uring3.mjs](code/uring3.mjs) | 해시 넷이 스레드 풀을 채운 상태에서 `fs.read`가 끝나는 시간을 잰다 |

### 실행 결과

`node epoll-server.mjs`를 띄운 직후와 `epoll-client.mjs`가 연결 셋을 연 뒤(WSL).

```text
서버만 연 상태: epoll(fd 17)이 지켜보는 소켓 1개 -> fd 23
손님 3명 접속 뒤: epoll(fd 17)이 지켜보는 소켓 4개 -> fd 23, 24, 25, 26
```

`node pool.mjs 8`(기본 풀 크기 4, Windows). 넷씩 나뉘어 끝난다.

```text
해시 #2 끝: 240ms
해시 #3 끝: 290ms
해시 #4 끝: 293ms
해시 #1 끝: 316ms
해시 #5 끝: 461ms
해시 #8 끝: 543ms
해시 #6 끝: 585ms
해시 #7 끝: 605ms
전체: 605ms
```

`UV_THREADPOOL_SIZE=8 node pool.mjs 8`(Windows).

```text
해시 #7 끝: 261ms
해시 #4 끝: 264ms
...
해시 #8 끝: 330ms
전체: 330ms
```

`dns.mjs`를 해시 수와 풀 크기를 바꿔 가며 잰 결과(Windows).

| 같이 도는 해시 | 풀 크기 | dns.lookup | readFile |
|---|---|---|---|
| 0개 | 4 | 12ms | 4ms |
| 4개 | 4 | 203ms | 204ms |
| 8개 | 4 | 504ms | 514ms |
| 4개 | 8 | 5ms | 3ms |

`uring3.mjs`를 io_uring 설정별로 돌린 결과(WSL).

```text
node v22.22.0, kernel 6.6.87.2-microsoft-standard-WSL2
기본값
해시 4개 도는 중 fs.read: 227ms
UV_USE_IO_URING=0
해시 4개 도는 중 fs.read: 367ms
UV_USE_IO_URING=1
해시 4개 도는 중 fs.read: 370ms
```

### 해 볼 때 참고

- Node 프로세스에는 eventpoll이 여러 개 보인다. 소켓을 지켜보는 것이 이벤트 루프의 epoll이다
- `uring3.mjs`는 파일을 해시보다 먼저 열어 둔다. 파일을 여는 일(open)도 스레드 풀로 가기 때문이다
- 스레드 풀은 처음 쓰일 때 한 번 만들어지고 그 뒤로 크기가 바뀌지 않는다. `UV_THREADPOOL_SIZE`는 프로세스를 시작할 때 환경 변수로 준다(예: `UV_THREADPOOL_SIZE=8 node dist/main`)
- 해시처럼 CPU를 쓰는 일은 풀을 코어 수보다 크게 늘려도 빨라지지 않는다
- Node 20.11.1부터 io_uring은 기본으로 꺼져 있다. 결과는 커널 버전과 Node 버전에 따라 다르다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node (Windows) | v24.11.0, 논리 코어 16 | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04, 커널 6.6.87.2-microsoft-standard-WSL2 | 2026-10-26 |
| libuv 스레드 풀 기본 크기 | 4 | 2026-10-26 |
| 스레드 풀을 쓰는 Node API | fs 비동기 API, dns.lookup, crypto.pbkdf2·scrypt·randomBytes 등 비동기 버전, zlib 비동기 버전 | 2026-10-26 |
| bcrypt 패키지 비동기 함수 | 스레드 풀에서 계산("The async version uses a thread pool"), 소스는 Napi::AsyncWorker, Node-API 비동기 작업은 워커 풀 스레드에서 실행 | 2026-10-26 |
| epoll 지켜보는 소켓 수 | 서버만 1개, 고객 3명 접속 뒤 4개 | 2026-10-26 |
| pbkdf2 200만 회 8개 | 풀 4: 첫 넷 240~316ms, 다음 넷 461~605ms / 풀 8: 전체 330ms | 2026-10-26 |
| 해시 중 dns.lookup·readFile | 0개 12·4ms, 4개 203·204ms, 8개 504·514ms, 풀 8에 4개 5·3ms | 2026-10-26 |
| io_uring 기본값 | Node 20.11.1부터 기본 꺼짐(CVE-2024-22017 보안 수정, 커밋 "deps: disable io_uring support in libuv by default"), UV_USE_IO_URING으로 조정 | 2026-10-26 |
| 해시 4개 중 fs.read | 기본 227ms, UV_USE_IO_URING=0 367ms, =1 370ms | 2026-10-26 |
| io_uring 커널 도입 | 리눅스 5.1 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 콜백과 프로미스가 불리는 순서 | [6강](../../part1/lecture6/) |
| 스레드 풀이 아닌 워커 스레드 | [7강](../../part1/lecture7/) |
| 비밀번호 해시 설계와 비용 인자 | 138강 |
| DNS 캐시와 결제사 호출 타임아웃 | 210강 |
| 디스크와 파일 I/O 성능 | 276강 |
| 파일 디스크립터 한도 | 277강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.

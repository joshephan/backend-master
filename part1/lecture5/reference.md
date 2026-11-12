# 5강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node (Windows) | v24.11.0, Windows 11, AMD Ryzen 7 9800X3D, 논리 코어 16 | `node -v` | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04, 커널 6.6.87.2-microsoft-standard-WSL2 | `node -v`, `uname -r` | 2026-10-26 |
| libuv 스레드 풀 기본 크기 | 4 | libuv 문서 | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. epoll과 io_uring은 리눅스, 스레드 풀 측정은 Windows에서 쟀다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node (Windows) | 강사 PC, Windows 11, AMD Ryzen 7 9800X3D | 2026-10-26 |
| Node (리눅스) | 같은 PC의 WSL | 2026-10-26 |
| libuv 스레드 풀 기본 크기 | libuv 문서 (UV_THREADPOOL_SIZE) | 2026-10-26 |
| 스레드 풀을 쓰는 Node API | Node 공식 문서 "Don't Block the Event Loop (or the Worker Pool)" | 2026-10-26 |
| bcrypt 패키지 비동기 함수 | https://github.com/kelektiv/node.bcrypt.js (README, src/bcrypt_node.cc), https://nodejs.org/api/n-api.html#napi_create_async_work (확인 2026-10-26) | 2026-10-26 |
| epoll 지켜보는 소켓 수 | WSL 실측, /proc/self/fdinfo의 tfd 항목 | 2026-10-26 |
| pbkdf2 200만 회 8개 | Windows 실측 | 2026-10-26 |
| 해시 중 dns.lookup·readFile | Windows 실측 | 2026-10-26 |
| io_uring 기본값 | Node v20.11.1 릴리스 노트 https://nodejs.org/en/blog/release/v20.11.1 , 2024년 2월 보안 릴리스 https://nodejs.org/en/blog/vulnerability/february-2024-security-releases (확인 2026-10-26) | 2026-10-26 |
| 해시 4개 중 fs.read | WSL 실측 | 2026-10-26 |
| io_uring 커널 도입 | Kernelnewbies Linux 5.1 변경 기록 https://kernelnewbies.org/Linux_5.1 (확인 2026-10-26) | 2026-10-26 |

## 참고 자료

- Node.js 문서, Don't Block the Event Loop (or the Worker Pool): https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- Node.js 문서, CLI 환경 변수 `UV_THREADPOOL_SIZE`: https://nodejs.org/api/cli.html#uv_threadpool_sizesize
- Node.js 문서, crypto `pbkdf2`: https://nodejs.org/api/crypto.html#cryptopbkdf2password-salt-iterations-keylen-digest-callback
- Node.js 문서, dns(`dns.lookup`과 구현상 주의점): https://nodejs.org/api/dns.html#implementation-considerations
- libuv 문서, Thread pool work scheduling: https://docs.libuv.org/en/v1.x/threadpool.html
- libuv 문서, Design overview: https://docs.libuv.org/en/v1.x/design.html
- Node v20.11.1 릴리스 노트(io_uring 기본 꺼짐): https://nodejs.org/en/blog/release/v20.11.1
- 리눅스 man 페이지, epoll(7): https://man7.org/linux/man-pages/man7/epoll.7.html

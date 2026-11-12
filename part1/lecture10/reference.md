# 10강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| Node HTTP 서버 기본값 | keepAliveTimeout 5000ms, keepAliveTimeoutBuffer 1000ms, headersTimeout 60000ms | `http.createServer()` 속성 출력 | 2026-10-26 |
| compression | 1.8.2 | `node_modules/compression/package.json` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 시간 값은 같은 PC 안에서 잰 것이라 환경마다 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node | node -v | 2026-10-26 |
| Node HTTP 서버 기본값 | http.createServer() 속성 출력 | 2026-10-26 |
| 실제 닫힘 시각 | 직접 실측 | 2026-10-26 |
| new http.Agent() keepAlive | 직접 실행 출력 | 2026-10-26 |
| globalAgent keepAlive | http.globalAgent.options 출력 | 2026-10-26 |
| 결제사 200건 | 직접 실측, 3회씩 | 2026-10-26 |
| 연결 리셋 경합 | 직접 실측, 시각마다 20회 | 2026-10-26 |
| nginx 업스트림 keepalive_timeout 기본값 | nginx 문서 ngx_http_upstream_module https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_timeout (확인 2026-10-26) | 2026-10-26 |
| ALB 유휴 시간 기본값 | AWS 문서 Application Load Balancers, Connection idle timeout https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html#connection-idle-timeout (확인 2026-10-26) | 2026-10-26 |
| 좌석 지도 압축 | curl 실측 | 2026-10-26 |
| 압축 시간 (zlib 직접) | 직접 실측, 5회씩 | 2026-10-26 |
| compression | node_modules/compression/index.js | 2026-10-26 |

## 참고 자료

- Node.js 문서, HTTP(`server.keepAliveTimeout`, `http.Agent`): https://nodejs.org/api/http.html
- Node.js 문서, HTTPS: https://nodejs.org/api/https.html
- Node.js 문서, Zlib(gzip, Brotli): https://nodejs.org/api/zlib.html
- NestJS 문서, Compression: https://docs.nestjs.com/techniques/compression
- compression 미들웨어 저장소: https://github.com/expressjs/compression
- IETF RFC 9112 HTTP/1.1(연결 유지와 종료): https://www.rfc-editor.org/rfc/rfc9112
- nginx 문서, ngx_http_upstream_module `keepalive_timeout`: https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_timeout
- AWS 문서, Application Load Balancer Connection idle timeout: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-load-balancer-attributes.html#connection-idle-timeout

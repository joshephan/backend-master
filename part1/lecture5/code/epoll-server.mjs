import net from 'node:net';
import { readdirSync, readlinkSync, readFileSync } from 'node:fs';

const link = fd => { try { return readlinkSync(`/proc/self/fd/${fd}`); } catch { return ''; } };

function showEpoll(label) {
  for (const fd of readdirSync('/proc/self/fd')) {
    if (link(fd) !== 'anon_inode:[eventpoll]') continue;
    const watched = readFileSync(`/proc/self/fdinfo/${fd}`, 'utf8')
      .split('\n').filter(l => l.startsWith('tfd:'))
      .map(l => l.match(/tfd:\s+(\d+)/)[1])
      .filter(t => link(t).startsWith('socket'));
    if (watched.length) console.log(`${label}: epoll(fd ${fd})이 지켜보는 소켓 ${watched.length}개 -> fd ${watched.sort((a, b) => a - b).join(', ')}`);
  }
}

let count = 0;
const server = net.createServer(() => {
  count++;
  if (count === 3) setTimeout(() => { showEpoll('손님 3명 접속 뒤'); process.exit(0); }, 100);
});
server.listen(5005, () => setTimeout(() => showEpoll('서버만 연 상태'), 50));

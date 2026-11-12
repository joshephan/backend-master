// 다른 서비스 흉내: TCP로 예매 서버에 묻는다
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: { host: '127.0.0.1', port: Number(process.env.TCP_PORT ?? 4001) },
});
try {
  console.log(await firstValueFrom(client.send('reservations.find', Number(process.argv[2]))));
} catch (err) {
  console.log('에러:', err);
} finally {
  client.close();
}

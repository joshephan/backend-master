import net from 'node:net';
for (let i = 0; i < 3; i++) net.connect(5005);
setTimeout(() => process.exit(0), 500);

console.log('1 동기 코드');
setTimeout(() => console.log('2 setTimeout 0'), 0);
setImmediate(() => console.log('3 setImmediate'));
Promise.resolve().then(() => console.log('4 Promise.then'));
process.nextTick(() => console.log('5 process.nextTick'));
queueMicrotask(() => console.log('6 queueMicrotask'));
console.log('7 동기 코드');

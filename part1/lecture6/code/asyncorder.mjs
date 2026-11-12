async function reserve() {
  console.log('2 reserve 시작');
  await null;
  console.log('4 await 다음 줄');
}
console.log('1 호출 전');
reserve();
console.log('3 호출 뒤');

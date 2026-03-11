// 测试 cleanUrl 函数
const cleanUrl = (url: string) => url.replace(/\/v1\/?$/, '').replace(/\/+$/, '');

const testUrls = [
  'https://www.chataiapi.com/v1',
  'https://www.chataiapi.com/v1/',
  'https://www.moyu.info',
  'https://www.moyu.info/',
  'https://api.viviai.cc/v1',
  'https://api.viviai.cc'
];

console.log('=== 测试 cleanUrl 函数 ===\n');

for (const url of testUrls) {
  const cleaned = cleanUrl(url);
  const finalUrl = `${cleaned}/api/usage/token`;
  console.log(`输入: ${url}`);
  console.log(`清理后: ${cleaned}`);
  console.log(`最终URL: ${finalUrl}`);
  console.log('---');
}

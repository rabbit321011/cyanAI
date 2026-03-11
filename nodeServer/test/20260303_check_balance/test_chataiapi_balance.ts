import axios from 'axios';

async function testEndpoint(apiKey: string, baseUrl: string, path: string) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 5000
    });
    console.log(`✅ ${path} - 成功`);
    console.log('   数据:', JSON.stringify(response.data, null, 2).substring(0, 300));
    return true;
  } catch (error: any) {
    console.log(`❌ ${path} - 失败: ${error.response?.status || error.message}`);
    return false;
  }
}

async function main() {
  const apiKey = 'sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp';
  const baseUrl = 'https://www.chataiapi.com';
  
  console.log('=== 测试 www.chataiapi.com 的各种余额查询接口 ===\n');
  
  // 尝试不同的接口路径
  const paths = [
    '/v1/usage',
    '/v1/billing',
    '/v1/balance',
    '/v1/user',
    '/v1/dashboard',
    '/api/usage',
    '/api/billing',
    '/api/balance',
    '/usage',
    '/billing',
    '/balance'
  ];
  
  for (const path of paths) {
    await testEndpoint(apiKey, baseUrl, path);
  }
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);

import axios from 'axios';

async function main() {
  const apiKey = 'sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp';
  const baseUrl = 'https://www.chataiapi.com/v1';
  
  console.log('=== 测试 www.chataiapi.com/v1 余额查询 ===\n');
  
  // 尝试 /v1/api/usage/token (有些API把v1放在前面)
  const paths = [
    '/api/usage/token',
    '/usage/token',
    '/token/usage',
    '/user/usage',
    '/dashboard/billing/credit_grants',
    '/billing/credit_grants',
    '/credit_grants'
  ];
  
  for (const path of paths) {
    const url = `${baseUrl}${path}`;
    console.log(`\n🌐 测试: ${url}`);
    try {
      const response = await axios.get(url, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ 成功!');
      console.log('📊 状态:', response.status);
      console.log('📄 数据:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      console.log('❌ 失败:', error.response?.status, error.message);
      if (error.response?.data) {
        console.log('   错误数据:', JSON.stringify(error.response.data, null, 2).substring(0, 200));
      }
    }
  }
}

main().catch(console.error);

import axios from 'axios';

async function main() {
  const apiKey = 'sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp';
  const baseUrl = 'https://www.chataiapi.com';
  
  console.log('=== 直接测试 www.chataiapi.com/api/usage/token ===\n');
  
  const url = `${baseUrl}/api/usage/token`;
  console.log(`🌐 URL: ${url}`);
  console.log(`🔑 Key: ${apiKey.substring(0, 20)}...`);
  
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
    console.log('📄 完整数据:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ 失败:', error.response?.status, error.message);
    if (error.response?.data) {
      console.log('📄 错误数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main().catch(console.error);

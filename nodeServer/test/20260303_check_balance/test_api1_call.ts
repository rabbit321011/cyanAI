import axios from 'axios';

async function testApi1Call() {
  const apiKey = 'sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp';
  const baseUrl = 'https://www.chataiapi.com/v1';
  
  console.log('=== 测试 API 1 (chataiapi.com) 调用 ===\n');
  
  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: 'gemini-3-flash-preview',
        messages: [
          { role: 'user', content: '你好，请回复"测试成功"' }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    console.log('✅ 调用成功！');
    console.log('响应:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('❌ 调用失败:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testApi1Call().catch(console.error);

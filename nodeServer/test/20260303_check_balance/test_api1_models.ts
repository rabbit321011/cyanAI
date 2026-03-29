import axios from 'axios';

async function listModels() {
  const apiKey = 'sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp';
  const baseUrl = 'https://www.chataiapi.com/v1';
  
  console.log('=== 查询 API 1 (chataiapi.com) 可用模型 ===\n');
  
  try {
    const response = await axios.get(
      `${baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ 查询成功！');
    const data = response.data;
    if (data.data && Array.isArray(data.data)) {
      console.log(`共 ${data.data.length} 个模型:\n`);
      const models = data.data.map((m: any) => m.id).sort();
      for (const model of models) {
        console.log(`  - ${model}`);
      }
    } else {
      console.log('响应:', JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.log('❌ 查询失败:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

listModels().catch(console.error);

import axios from 'axios';

async function testMoyuAPI() {
  console.log('=== 测试新 API: www.moyu.info ===\n');
  
  const apiKey = 'sk-iWWosV3KuF0zo4JCDGc2WIxJyqr5Gx7I1vchhXZYsBn3g4Sj';
  const baseUrl = 'https://www.moyu.info';
  const model = 'gemini-2.0-flash'; // 尝试使用这个模型，如果不行可以换其他模型
  
  const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'Hello, 请简单介绍一下自己'
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500
    }
  };
  
  console.log('📤 发送请求...');
  console.log('🌐 URL:', url.replace(apiKey, apiKey.substring(0, 10) + '...'));
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2分钟超时
    });
    
    console.log('\n✅ 请求成功！');
    console.log('\n📊 响应状态:', response.status);
    console.log('\n📄 完整响应:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 提取文本响应
    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      console.log('\n📝 模型回复:', text);
    }
    
  } catch (error: any) {
    console.error('\n❌ 请求失败');
    console.error('错误信息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testMoyuAPI();

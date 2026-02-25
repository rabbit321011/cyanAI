const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/cyan';

async function testAPI() {
  console.log('=== 测试 cyanAI API ===\n');

  try {
    // 1. 测试 /exit 接口
    console.log('1. 测试 /exit 接口...');
    const exitRes = await axios.post(`${BASE_URL}/exit`);
    console.log('✅ /exit 响应:', exitRes.data);
    console.log('');

    // 2. 测试 /send 接口
    console.log('2. 测试 /send 接口...');
    const sendRes = await axios.post(`${BASE_URL}/send`, {
      current: '你好！这是一条通过 API 发送的测试消息',
      user_name: 'API测试用户'
    });
    console.log('✅ /send 响应:', sendRes.data);
    console.log('');

    // 3. 测试 /closeEvent 接口
    console.log('3. 测试 /closeEvent 接口...');
    const closeRes = await axios.post(`${BASE_URL}/closeEvent`);
    console.log('✅ /closeEvent 响应:', closeRes.data);
    console.log('');

    console.log('🎉 所有接口测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
  }
}

testAPI();

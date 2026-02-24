// 测试后端连接的脚本
// 用于验证花生壳暴露出的网址是否能成功连接到后端服务器

const backendApiBaseUrl = "http://35b9a934.r24.cpolar.top";

// 测试检测状态接口
async function testExitEndpoint() {
  try {
    console.log(`测试检测状态接口: ${backendApiBaseUrl}/api/cyan/exit`);
    const response = await fetch(`${backendApiBaseUrl}/api/cyan/exit`);
    console.log(`状态码: ${response.status}`);
    const data = await response.json();
    console.log(`响应数据:`, data);
    return true;
  } catch (error) {
    console.error(`测试检测状态接口失败:`, error.message);
    return false;
  }
}

// 测试发送消息接口
async function testSendEndpoint() {
  try {
    console.log(`测试发送消息接口: ${backendApiBaseUrl}/api/cyan/send`);
    const response = await fetch(`${backendApiBaseUrl}/api/cyan/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        current: '测试消息',
        user_name: 'TestUser'
      })
    });
    console.log(`状态码: ${response.status}`);
    const data = await response.json();
    console.log(`响应数据:`, data);
    return true;
  } catch (error) {
    console.error(`测试发送消息接口失败:`, error.message);
    return false;
  }
}

// 测试根路径
async function testRootEndpoint() {
  try {
    console.log(`测试根路径: ${backendApiBaseUrl}`);
    const response = await fetch(`${backendApiBaseUrl}`);
    console.log(`状态码: ${response.status}`);
    const data = await response.text();
    console.log(`响应数据:`, data);
    return true;
  } catch (error) {
    console.error(`测试根路径失败:`, error.message);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始测试后端连接...');
  console.log('====================================');
  
  await testRootEndpoint();
  console.log('------------------------------------');
  
  await testExitEndpoint();
  console.log('------------------------------------');
  
  await testSendEndpoint();
  console.log('------------------------------------');
  
  console.log('测试完成！');
}

// 执行测试
runAllTests();
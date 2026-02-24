import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/cyan';

async function testExitStatus() {
    console.log('📋 测试 1: /api/cyan/exit (检测状态)');
    try {
        const response = await axios.post(`${BASE_URL}/exit`);
        console.log('✅ 成功!');
        console.log('响应:', response.data);
        console.log('');
        return response.data.result;
    } catch (error: any) {
        console.error('❌ 失败:', error.response?.data || error.message);
        console.log('');
        return false;
    }
}

async function testSendMessage() {
    console.log('📋 测试 2: /api/cyan/send (发送消息)');
    try {
        const response = await axios.post(`${BASE_URL}/send`, {
            current: '你好！我是测试用户，请简单介绍一下自己。',
            user_name: 'TestUser'
        });
        console.log('✅ 成功!');
        console.log('模型回复:', response.data.result);
        console.log('');
        return true;
    } catch (error: any) {
        console.error('❌ 失败:', error.response?.data || error.message);
        console.log('');
        return false;
    }
}

async function main() {
    console.log('========================================');
    console.log('🚀 CyanAI API 测试');
    console.log('========================================');
    console.log('');

    await testExitStatus();
    await testSendMessage();

    console.log('========================================');
    console.log('✅ 测试完成!');
    console.log('========================================');
}

main();

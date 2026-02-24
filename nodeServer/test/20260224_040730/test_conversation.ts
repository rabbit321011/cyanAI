import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/cyan';

async function sendMessage(message: string, userName: string) {
    try {
        const response = await axios.post(`${BASE_URL}/send`, {
            current: message,
            user_name: userName
        });
        return response.data.result;
    } catch (error: any) {
        console.error('❌ 发送失败:', error.response?.data || error.message);
        return null;
    }
}

async function main() {
    console.log('========================================');
    console.log('🚀 CyanAI 连续对话测试');
    console.log('========================================');
    console.log('');

    const userName = 'TestUser';

    // 第 1 轮对话
    console.log('📝 第 1 轮对话');
    console.log('用户:', '你好！我是测试用户。');
    const reply1 = await sendMessage('你好！我是测试用户。', userName);
    if (reply1) {
        console.log('模型:', reply1);
    }
    console.log('');

    // 第 2 轮对话
    console.log('📝 第 2 轮对话');
    console.log('用户:', '你还记得我是谁吗？');
    const reply2 = await sendMessage('你还记得我是谁吗？', userName);
    if (reply2) {
        console.log('模型:', reply2);
    }
    console.log('');

    // 第 3 轮对话
    console.log('📝 第 3 轮对话');
    console.log('用户:', '很高兴认识你！');
    const reply3 = await sendMessage('很高兴认识你！', userName);
    if (reply3) {
        console.log('模型:', reply3);
    }
    console.log('');

    console.log('========================================');
    console.log('✅ 连续对话测试完成!');
    console.log('========================================');
}

main();

import { callDeepSeekLLM, DeepSeekRequest } from './deepseek_call';

async function testDeepSeekCall() {
    console.log('🚀 开始测试 DeepSeek API...\n');

    const testRequest: DeepSeekRequest = {
        messages: [
            {
                role: 'system',
                content: '你是一个资深的程序员，请用幽默的语气回答，并且必须在结尾加一个emoji'
            },
            {
                role: 'user',
                content: 'TypeScript中的 Interface 和 Type 有什么区别？'
            }
        ],
        temperature: 1.3
    };

    const apiKey = 'sk-05eb852fa65b471a8187a3dd54905eb7';
    const model = 'deepseek-chat';
    const baseUrl = 'https://api.deepseek.com';

    try {
        console.log('📤 发送请求...');
        const response = await callDeepSeekLLM(testRequest, apiKey, model, baseUrl);

        console.log('\n✅ 请求成功！');
        console.log('📝 回复内容：');
        console.log('=====================================');
        console.log(response.text);
        console.log('=====================================');

        if (response.usage) {
            console.log('\n📊 Token 使用情况：');
            console.log('  输入 Token:', response.usage.prompt_tokens);
            console.log('  输出 Token:', response.usage.completion_tokens);
            console.log('  总计 Token:', response.usage.total_tokens);
        }

        if (response.functionCalls) {
            console.log('\n🔧 函数调用：', response.functionCalls);
        }

    } catch (error) {
        console.log('\n❌ 请求失败！');
        console.error('错误详情：', error);
    }
}

testDeepSeekCall();

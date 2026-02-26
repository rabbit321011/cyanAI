import { callDeepSeekLLM, DeepSeekRequest } from './deepseek_call';

async function testFunctionCall() {
    console.log('🚀 开始测试 DeepSeek API 函数调用...\n');

    const testRequest: DeepSeekRequest = {
        messages: [
            {
                role: 'system',
                content: '你是一个天气查询助手，当用户询问天气时，必须调用 get_weather 函数来获取天气信息'
            },
            {
                role: 'user',
                content: '杭州今天的天气怎么样？'
            }
        ],
        tools: [
            {
                type: 'function',
                function: {
                    name: 'get_weather',
                    description: '获取指定城市的当前天气',
                    parameters: {
                        type: 'object',
                        properties: {
                            city: { type: 'string', description: '城市名称，如：杭州' }
                        },
                        required: ['city']
                    }
                }
            }
        ]
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
            console.log('\n🔧 函数调用：');
            console.log(JSON.stringify(response.functionCalls, null, 2));
            
            // 检查每个函数调用是否有 id 字段
            response.functionCalls.forEach((call, index) => {
                console.log(`\n📞 函数调用 ${index + 1}:`);
                console.log('  函数名:', call.name);
                console.log('  参数:', call.args);
                console.log('  ID:', call.id ? call.id : '❌ 没有 ID 字段');
            });
        }

    } catch (error) {
        console.log('\n❌ 请求失败！');
        console.error('错误详情：', error);
    }
}

testFunctionCall();
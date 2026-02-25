import { callGoogleLLM, EasyGeminiRequest } from './src/utility/LLM_call/google_call';

async function testGoogleMessage() {
    console.log('🚀 测试 Google Gemini API 消息发送...\n');

    const testRequest: EasyGeminiRequest = {
        systemInstruction: "你是一个友好的助手，请简洁回答，结尾加一个emoji",
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "你好！今天天气怎么样？" }
                ]
            }
        ]
    };

    const apiKey = "sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp";
    const model = "gemini-3-flash-preview";
    const baseUrl = "https://www.chataiapi.com/v1";

    try {
        console.log('📤 发送请求...');
        const response = await callGoogleLLM(testRequest, apiKey, model, baseUrl);
        
        console.log('\n✅ 请求成功！');
        console.log('📝 回复内容：');
        console.log('=====================================');
        console.log(response.text);
        console.log('=====================================');

    } catch (error) {
        console.log('\n❌ 请求失败！');
        console.error('错误详情：', error);
    }
}

testGoogleMessage();

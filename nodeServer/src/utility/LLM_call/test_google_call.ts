import { callGoogleLLM, EasyGeminiRequest } from './google_call';

async function testGoogleCall() {
    console.log('🚀 开始测试 Google Gemini API...\n');

    const testRequest: EasyGeminiRequest = {
        systemInstruction: "你是一个资深的程序员，请用幽默的语气回答，并且必须在结尾加一个emoji",
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "TypeScript中的 Interface 和 Type 有什么区别？" }
                ]
            }
        ]
    };

    const apiKey = "sk-XnSkvIFdNx3CyjAF6E2Cy9puLpDSB7rYcBKlkKb64XrcDljb";
    const model = "gemini-2.0-flash";
    const baseUrl = "https://www.chataiapi.com/v1";

    try {
        console.log('📤 发送请求...');
        const response = await callGoogleLLM(testRequest, apiKey, model, baseUrl);
        
        console.log('\n✅ 请求成功！');
        console.log('📝 回复内容：');
        console.log('=====================================');
        console.log(response.text);
        console.log('=====================================');

        if (response.functionCalls) {
            console.log('\n🔧 函数调用：', response.functionCalls);
        }

    } catch (error) {
        console.log('\n❌ 请求失败！');
        console.error('错误详情：', error);
    }
}

testGoogleCall();

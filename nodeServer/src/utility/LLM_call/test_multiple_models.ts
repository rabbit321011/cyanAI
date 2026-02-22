import { callGoogleLLM, EasyGeminiRequest } from './google_call';

const modelsToTest = [
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash'
];

async function testModels() {
  console.log('🚀 开始测试多个 Gemini 模型...\n');

  const testRequest: EasyGeminiRequest = {
    systemInstruction: "你是一个友好的助手，请简洁回答，结尾加一个emoji",
    contents: [
      {
        role: 'user',
        parts: [
          { text: "你好！请用一句话介绍你自己。" }
        ]
      }
    ]
  };

  const apiKey = "sk-XnSkvIFdNx3CyjAF6E2Cy9puLpDSB7rYcBKlkKb64XrcDljb";
  const baseUrl = "https://www.chataiapi.com/v1";

  const results: Array<{ model: string; success: boolean; response?: string; error?: string }> = [];

  for (const model of modelsToTest) {
    console.log(`\n📋 测试模型: ${model}`);
    console.log('-------------------------------------');

    try {
      const response = await callGoogleLLM(testRequest, apiKey, model, baseUrl);
      console.log('✅ 成功!');
      console.log('回复:', response.text);
      results.push({
        model,
        success: true,
        response: response.text
      });
    } catch (error: any) {
      console.log('❌ 失败!');
      console.log('错误:', error.message);
      results.push({
        model,
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n\n📊 测试总结');
  console.log('=====================================');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.model}`);
  });
  console.log('=====================================');
}

testModels();

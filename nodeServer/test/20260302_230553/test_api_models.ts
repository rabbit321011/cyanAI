// 测试不同模型
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function testModel(modelName: string) {
    console.log(`\n=== 测试模型: ${modelName} ===`);
    
    const iniPath = path.join(__dirname, '../../library_source.ini');
    const apiKey = readIni(iniPath, 'google_api_key');
    const baseUrl = readIni(iniPath, 'google_base_url');
    
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [{ text: '你好' }]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 50
        }
    };
    
    try {
        const response = await callGoogleLLM(request, apiKey, modelName, baseUrl);
        console.log("✅ 成功！");
        console.log("回复:", response.text.substring(0, 50));
        return true;
    } catch (error: any) {
        console.log("❌ 失败:", error.message);
        return false;
    }
}

async function testAllModels() {
    console.log("=== 测试可用模型 ===\n");
    
    const models = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-2.0-pro-exp",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
        "gpt-4o",
        "gpt-4o-mini",
        "claude-3-5-sonnet"
    ];
    
    for (const model of models) {
        await testModel(model);
    }
    
    console.log("\n=== 测试完成 ===");
}

testAllModels();

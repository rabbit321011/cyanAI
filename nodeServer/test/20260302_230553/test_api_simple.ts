// 简单测试 API 调用
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function testSimpleAPI() {
    console.log("=== 测试简单 API 调用 ===\n");
    
    const iniPath = path.join(__dirname, '../../library_source.ini');
    console.log("INI 文件路径:", iniPath);
    
    const apiKey = readIni(iniPath, 'google_api_key');
    const baseUrl = readIni(iniPath, 'google_base_url');
    
    console.log("API Key:", apiKey.substring(0, 20) + "...");
    console.log("Base URL:", baseUrl);
    
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [{ text: '你好，这是一个测试' }]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 100
        }
    };
    
    console.log("\n发送请求...");
    try {
        const response = await callGoogleLLM(request, apiKey, "gemini-2.0-flash", baseUrl);
        console.log("成功！");
        console.log("回复:", response.text);
    } catch (error: any) {
        console.error("失败:", error.message);
    }
}

testSimpleAPI();

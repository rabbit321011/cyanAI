// 调试图片总结 - 使用 gemini-2.5-flash
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testImageDebug() {
    console.log("=== 调试图片总结 (gemini-2.5-flash) ===\n");
    
    const iniPath = path.join(__dirname, '../../library_source.ini');
    const apiKey = readIni(iniPath, 'google_api_key');
    const baseUrl = readIni(iniPath, 'google_base_url');
    
    console.log("API Key:", apiKey.substring(0, 20) + "...");
    console.log("Base URL:", baseUrl);
    
    // 读取测试图片
    const imagePath = "C:\\Users\\jbbj\\Pictures\\Screenshots\\屏幕截图 2026-01-11 213709.png";
    console.log("\n读取图片:", imagePath);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    // 检测 MIME 类型
    let mimeType = 'image/png';
    const magic = imageBuffer.slice(0, 4);
    if (magic[0] === 0x89 && magic[1] === 0x50) {
        mimeType = 'image/png';
    }
    console.log("MIME 类型:", mimeType);
    console.log("图片大小:", (base64.length / 1024).toFixed(2), "KB (base64)");
    
    const promptText = '请描述这张图片的内容。如果图片中包含文档或文字，请完整列出所有可见的文字；如果是普通图片，请详细描述画面内容、人物、场景、色彩等，尽量100字以内。格式：直接输出描述内容，不要加任何前缀。';
    
    console.log("\n提示词:", promptText);
    
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [
                { text: promptText },
                { inlineData: { mimeType, data: base64 } }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
        }
    };
    
    console.log("\n请求体:");
    console.log(JSON.stringify(request, null, 2));
    
    console.log("\n发送请求到 gemini-2.5-flash...");
    try {
        const response = await callGoogleLLM(request, apiKey, "gemini-2.5-flash", baseUrl);
        console.log("\n✅ 请求成功！");
        console.log("\n=== 完整响应 ===");
        console.log("text:", response.text);
        console.log("text 长度:", response.text.length);
        console.log("\nfunctionCalls:", response.functionCalls);
        console.log("\nrawResponse 是否存在:", !!response.rawResponse);
        if (response.rawResponse) {
            console.log("\n=== rawResponse ===");
            console.log(JSON.stringify(response.rawResponse, null, 2));
        }
    } catch (error: any) {
        console.log("\n❌ 失败:");
        console.log(error.message);
        if (error.response) {
            console.log("\n错误响应:");
            console.log(JSON.stringify(error.response.data, null, 2));
        }
    }
}

testImageDebug();

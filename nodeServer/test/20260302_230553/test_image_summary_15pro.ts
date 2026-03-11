// 使用 gemini-1.5-pro 测试图片总结
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testImageSummary() {
    console.log("=== 使用 gemini-1.5-pro 测试图片总结 ===\n");
    
    const iniPath = path.join(__dirname, '../../library_source.ini');
    const apiKey = readIni(iniPath, 'google_api_key');
    const baseUrl = readIni(iniPath, 'google_base_url');
    
    // 读取测试图片
    const imagePath = "C:\\Users\\jbbj\\Pictures\\Screenshots\\屏幕截图 2026-01-11 213709.png";
    console.log("读取图片:", imagePath);
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    // 检测 MIME 类型
    let mimeType = 'image/png';
    const magic = imageBuffer.slice(0, 4);
    if (magic[0] === 0x89 && magic[1] === 0x50) {
        mimeType = 'image/png';
    }
    console.log("MIME 类型:", mimeType);
    
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [
                { text: '请描述这张图片的内容。如果图片中包含文档或文字，请完整列出所有可见的文字；如果是普通图片，请详细描述画面内容、人物、场景、色彩等，字数不限。格式：直接输出描述内容，不要加任何前缀。' },
                { inlineData: { mimeType, data: base64 } }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
        }
    };
    
    console.log("\n发送请求...");
    try {
        const response = await callGoogleLLM(request, apiKey, "gemini-1.5-pro", baseUrl);
        console.log("\n✅ 成功！");
        console.log("\n图片总结结果:");
        console.log(response.text);
        console.log("\n输出长度:", response.text.length, "字符");
    } catch (error: any) {
        console.log("❌ 失败:", error.message);
    }
}

testImageSummary();

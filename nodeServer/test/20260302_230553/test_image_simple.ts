// 简单测试图片识别
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testImageSimple() {
    console.log("=== 简单测试图片识别 ===\n");
    
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
    
    // 测试不同的提示词
    const prompts = [
        "描述这张图片",
        "这张图片里有什么？",
        "请详细描述图片内容"
    ];
    
    for (const prompt of prompts) {
        console.log(`\n--- 测试提示词: "${prompt}" ---`);
        
        const request: EasyGeminiRequest = {
            contents: [{
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType, data: base64 } }
                ]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        };
        
        try {
            const response = await callGoogleLLM(request, apiKey, "gemini-2.5-flash", baseUrl);
            console.log("结果:", response.text || "(空)");
            console.log("长度:", response.text?.length || 0, "字符");
        } catch (error: any) {
            console.log("错误:", error.message);
        }
    }
}

testImageSimple();

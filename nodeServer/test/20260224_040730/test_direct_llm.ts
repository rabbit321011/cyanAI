import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function main() {
    try {
        const iniPath = path.join(__dirname, '../../library_source.ini');
        const apiKey = readIni(iniPath, 'google_api_key');
        const baseUrl = readIni(iniPath, 'google_base_url');
        
        console.log('正在直接测试 LLM API...');
        console.log('API Key:', apiKey.substring(0, 15) + '...');
        console.log('Base URL:', baseUrl);
        console.log('');
        
        const request: EasyGeminiRequest = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: '你好！请说一句话测试一下。' }
                    ]
                }
            ]
        };
        
        console.log('发送请求中...');
        const response = await callGoogleLLM(
            request,
            apiKey,
            'gemini-3-pro-preview',
            baseUrl
        );
        
        console.log('✅ 成功!');
        console.log('模型回复:', response.text);
        
    } catch (error) {
        console.error('❌ 失败:', error);
    }
}

main();

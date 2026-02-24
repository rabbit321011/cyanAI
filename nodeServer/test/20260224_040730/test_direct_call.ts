import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function main() {
    try {
        const iniPath = path.join(__dirname, '../../library_source.ini');
        const apiKey = readIni(iniPath, 'google_api_key');
        const baseUrl = readIni(iniPath, 'google_base_url');
        
        console.log('正在调用 Gemini 3.0 Pro...');
        console.log('API Key:', apiKey.substring(0, 15) + '...');
        console.log('Base URL:', baseUrl);
        console.log('');
        
        const request: EasyGeminiRequest = {
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: '你是谁？运行在什么平台？你能做什么' }
                    ]
                }
            ]
        };
        
        const response = await callGoogleLLM(
            request,
            apiKey,
            'gemini-3-pro-preview',
            baseUrl
        );
        
        console.log('✅ 请求成功！');
        console.log('');
        console.log('🤖 模型回复：');
        console.log('================================');
        console.log(response.text);
        console.log('================================');
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            console.log('');
            console.log('🔧 函数调用：');
            console.log(response.functionCalls);
        }
        
    } catch (error) {
        console.error('❌ 请求失败:', error);
    }
}

main();

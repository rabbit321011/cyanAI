import { getAvailableModels } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function main() {
    try {
        const iniPath = path.join(__dirname, '../../library_source.ini');
        const apiKey = readIni(iniPath, 'google_api_key');
        const baseUrl = readIni(iniPath, 'google_base_url');
        
        console.log('正在获取可用模型列表...');
        console.log(`API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`Base URL: ${baseUrl}`);
        console.log('');
        
        const models = await getAvailableModels(apiKey, baseUrl);
        
        console.log('✅ 获取成功！可用模型：');
        console.log('================================');
        models.forEach((model, index) => {
            console.log(`${index + 1}. ${model}`);
        });
        console.log('================================');
        console.log(`共 ${models.length} 个模型`);
        
    } catch (error) {
        console.error('❌ 获取模型列表失败:', error);
    }
}

main();

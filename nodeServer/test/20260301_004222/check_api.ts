import { getTokenUsage, getAvailableModels } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function checkApiStatus() {
    const apiKey = readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key');
    const baseUrl = readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url');
    
    console.log('========== API 状态检查 ==========\n');
    console.log('Base URL:', baseUrl);
    console.log('API Key:', apiKey.substring(0, 10) + '...\n');
    
    console.log('1. 查询额度使用情况...');
    try {
        const usage = await getTokenUsage(apiKey, baseUrl);
        console.log('   结果:', JSON.stringify(usage, null, 2));
    } catch (error: any) {
        console.log('   错误:', error.message);
    }
    console.log('');
    
    console.log('2. 查询可用模型...');
    try {
        const models = await getAvailableModels(apiKey, baseUrl);
        console.log('   可用模型数量:', models.length);
        console.log('   前10个模型:', models.slice(0, 10));
    } catch (error: any) {
        console.log('   错误:', error.message);
    }
    
    console.log('\n========== 检查结束 ==========');
}

checkApiStatus().catch(console.error);

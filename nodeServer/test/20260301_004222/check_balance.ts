import { getTokenUsage } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function checkBalance() {
    const apiKey = readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key');
    const baseUrl = readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url');
    
    console.log('========== 查询 Gemini API 余额 ==========\n');
    console.log('Base URL:', baseUrl);
    console.log('API Key:', apiKey.substring(0, 10) + '...\n');
    
    try {
        const usage = await getTokenUsage(apiKey, baseUrl);
        console.log('查询结果:');
        console.log('  状态:', usage.code ? '成功' : '失败');
        console.log('  消息:', usage.message);
        
        if (usage.data) {
            console.log('  账户名称:', usage.data.name);
            console.log('  总额度:', usage.data.total_granted.toLocaleString(), 'tokens');
            console.log('  已使用:', usage.data.total_used.toLocaleString(), 'tokens');
            console.log('  剩余额度:', usage.data.total_available.toLocaleString(), 'tokens');
            console.log('  无限额度:', usage.data.unlimited_quota);
            
            if (usage.data.expires_at > 0) {
                const expireDate = new Date(usage.data.expires_at * 1000);
                console.log('  过期时间:', expireDate.toLocaleString());
            }
        }
    } catch (error: any) {
        console.error('查询失败:', error.message);
    }
    
    console.log('\n========== 查询完成 ==========');
}

checkBalance().catch(console.error);

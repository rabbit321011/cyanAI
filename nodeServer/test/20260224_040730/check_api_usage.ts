import { getTokenUsage } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function main() {
    try {
        const iniPath = path.join(__dirname, '../../library_source.ini');
        const apiKey = readIni(iniPath, 'google_api_key');
        const baseUrl = readIni(iniPath, 'google_base_url');
        
        console.log('========================================');
        console.log('🔍 查询 API Key 额度使用情况');
        console.log('========================================');
        console.log('');
        console.log('API Key:', apiKey.substring(0, 15) + '...');
        console.log('Base URL:', baseUrl);
        console.log('');
        
        console.log('正在查询...');
        const usage = await getTokenUsage(apiKey, baseUrl);
        
        console.log('');
        console.log('✅ 查询成功!');
        console.log('');
        
        if (usage.data) {
            console.log('📊 额度详情:');
            console.log('  名称:', usage.data.name);
            console.log('  总授予:', usage.data.total_granted);
            console.log('  已使用:', usage.data.total_used);
            console.log('  剩余可用:', usage.data.total_available);
            console.log('  无限额度:', usage.data.unlimited_quota ? '是' : '否');
            console.log('');
            
            const percentage = (usage.data.total_used / usage.data.total_granted * 100).toFixed(2);
            console.log(`💸 使用百分比: ${percentage}%`);
            
            const remaining = usage.data.total_granted - usage.data.total_used;
            console.log(`💰 剩余额度: ${remaining} (总共 $600)`);
        }
        
        console.log('');
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ 查询失败:', error);
    }
}

main();

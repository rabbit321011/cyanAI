import { getTokenUsage } from './src/utility/LLM_call/google_call';

async function checkBalance() {
    console.log('💰 开始查询 API Key 余额...\n');

    // Google API Key
    const googleApiKey = "sk-TGKuoviqTh7BVNM8ZmQkaOmDqpXVyCiyZUjf6oM9GGsMUIOp";
    const googleBaseUrl = "https://www.chataiapi.com/v1";

    try {
        console.log('📋 查询 Google API Key 余额...');
        const usage = await getTokenUsage(googleApiKey, googleBaseUrl);
        console.log('✅ 成功获取余额信息:');
        console.log('=====================================');
        console.log('状态:', usage.message);
        if (usage.data) {
            console.log('名称:', usage.data.name);
            console.log('授予总量:', usage.data.total_granted);
            console.log('已使用额度:', usage.data.total_used);
            console.log('可用剩余额度:', usage.data.total_available);
            console.log('是否无限额度:', usage.data.unlimited_quota);
        }
        console.log('=====================================');

    } catch (error) {
        console.log('\n❌ 查询失败！');
        console.error('错误详情：', error);
    }
}

checkBalance();

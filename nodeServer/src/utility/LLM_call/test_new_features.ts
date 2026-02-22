import { getAvailableModels, getTokenUsage } from './google_call';

async function testNewFeatures() {
    console.log('🚀 测试新增功能...\n');

    const apiKey = "sk-XnSkvIFdNx3CyjAF6E2Cy9puLpDSB7rYcBKlkKb64XrcDljb";
    const baseUrl = "https://www.chataiapi.com/v1";

    try {
        console.log('📋 测试 1: 获取模型列表...');
        const models = await getAvailableModels(apiKey, baseUrl);
        console.log('✅ 成功获取模型列表:');
        console.log('=====================================');
        models.forEach((model, index) => {
            console.log(`  ${index + 1}. ${model}`);
        });
        console.log('=====================================\n');

        console.log('💰 测试 2: 获取 API Key 余额...');
        const usage = await getTokenUsage(apiKey, baseUrl);
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

        console.log('\n🎉 所有测试完成！');

    } catch (error) {
        console.log('\n❌ 测试失败！');
        console.error('错误详情：', error);
    }
}

testNewFeatures();

import {
    getRemainingTokens,
    getEquivalentBalance,
    getUsageInfo,
    getRawTokenUsage
} from '../../src/utility/usage/usage_meter';

async function runTests() {
    console.log('开始测试 usage_meter.ts (真实 API 调用)...\n');

    try {
        console.log('1. 测试 getRawTokenUsage() - 获取原始 API 响应');
        const rawResponse = await getRawTokenUsage();
        console.log('   原始响应:', JSON.stringify(rawResponse, null, 2));
        console.log('   ✅ getRawTokenUsage() 测试通过\n');

        console.log('2. 测试 getRemainingTokens() - 查询剩余 token');
        const remainingTokens = await getRemainingTokens();
        console.log('   剩余 token:', remainingTokens);
        console.log('   ✅ getRemainingTokens() 测试通过\n');

        console.log('3. 测试 getEquivalentBalance() - 查询等效余额');
        const equivalentBalance = await getEquivalentBalance();
        console.log('   等效余额:', equivalentBalance);
        console.log('   ✅ getEquivalentBalance() 测试通过\n');

        console.log('4. 测试 getUsageInfo() - 获取完整使用信息');
        const usageInfo = await getUsageInfo();
        console.log('   完整使用信息:');
        console.log('     - 总授予量:', usageInfo.totalGranted);
        console.log('     - 已使用量:', usageInfo.totalUsed);
        console.log('     - 剩余 token:', usageInfo.remainingTokens);
        console.log('     - 等效余额:', usageInfo.equivalentBalance);
        console.log('     - 无限额度:', usageInfo.unlimitedQuota);
        console.log('     - 过期时间:', new Date(usageInfo.expiresAt * 1000).toLocaleString());
        console.log('   ✅ getUsageInfo() 测试通过\n');

        console.log('5. 验证等效余额计算正确');
        // 等效余额 = (剩余 token / 总授予 token) * 80
        const expectedEquivalentBalance = (remainingTokens / 300000000) * 80;
        if (Math.abs(equivalentBalance - expectedEquivalentBalance) < 0.001) {
            console.log('   ✅ 验证通过: 等效余额计算正确');
            console.log(`      计算公式: (${remainingTokens} / 300000000) * 80 = ${expectedEquivalentBalance.toFixed(4)}`);
        } else {
            throw new Error(`验证失败: 预期等效余额 ${expectedEquivalentBalance}, 实际 ${equivalentBalance}`);
        }

        console.log('\n========================================');
        console.log('✅ 所有测试通过！');
        console.log('========================================');

    } catch (error: any) {
        console.error('\n❌ 测试失败:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runTests();

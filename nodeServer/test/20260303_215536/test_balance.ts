import { getEquivalentBalance, getAllKeysBalance } from '../../src/utility/usage/usage_meter';

async function testBalance() {
    console.log('=== 测试余额查询功能 ===\n');
    
    try {
        // 测试查询所有 Key 的余额
        console.log('1. 测试 getAllKeysBalance()');
        const allBalances = await getAllKeysBalance();
        console.log('所有 Key 的余额详情:', allBalances);
        
        console.log('\n2. 测试 getEquivalentBalance()');
        const totalBalance = await getEquivalentBalance();
        console.log('总余额:', totalBalance);
        
    } catch (error) {
        console.error('测试失败:', error);
    }
    
    console.log('\n=== 测试完成 ===');
}

testBalance().catch(console.error);

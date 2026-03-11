import { now, sub, compare } from '../../src/utility/time/cyan_time';

async function testCyanTime() {
    console.log('=== 测试 cyan_time ===\n');
    
    const currentTime = now();
    console.log('当前时间:', currentTime);
    
    const timeDiff = sub(currentTime, '15min');
    console.log('时间差:', timeDiff);
    
    const comparison = compare(timeDiff, '15min');
    console.log('比较结果:', comparison);
    
    console.log('\n=== 测试完成 ===');
}

testCyanTime().catch(console.error);

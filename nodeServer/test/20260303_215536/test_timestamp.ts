import { convert } from '../../src/utility/time/cyan_time';

async function testTimestampConversion() {
    console.log('=== 测试时间戳转换 ===\n');
    
    // 测试 Unix 时间戳转换
    const timestamp = 1772546457439;
    console.log('原始时间戳:', timestamp);
    
    try {
        const converted = convert(timestamp.toString(), 'timestamp');
        console.log('转换结果:', converted);
    } catch (error) {
        console.error('转换失败:', error);
    }
    
    console.log('\n=== 测试完成 ===');
}

testTimestampConversion().catch(console.error);

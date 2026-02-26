import { excuteTool } from './src/component/process/tool_process';

async function testToolProcess() {
    console.log('🚀 开始测试 tool_process 功能...\n');

    try {
        // 测试 any-example 工具
        console.log('📤 调用 any-example 工具...');
        const result = await excuteTool('any-example', '请测试一个简单的功能', true);
        
        console.log('\n✅ 工具执行成功！');
        console.log('📝 执行结果：');
        console.log('=====================================');
        console.log(result);
        console.log('=====================================');

    } catch (error) {
        console.log('\n❌ 执行失败！');
        console.error('错误详情：', error);
    }
}

testToolProcess();
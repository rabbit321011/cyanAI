import { excuteTool } from './src/component/process/tool_process';

async function testNonWaitMode() {
    console.log('🚀 开始测试非等待模式...\n');

    try {
        // 测试非等待模式
        console.log('📤 调用 any-example 工具（非等待模式）...');
        const result = await excuteTool('any-example', '请测试一个简单的功能', false);
        
        console.log('\n✅ 非等待模式调用成功！');
        console.log('📝 返回结果：');
        console.log('=====================================');
        console.log(result);
        console.log('=====================================');

        console.log('\n⌛ 工具正在后台执行，请等待执行完成...');
        console.log('\n执行完成后，结果会保存到：core_datas/tool_responses/ 目录下');

    } catch (error) {
        console.log('\n❌ 执行失败！');
        console.error('错误详情：', error);
    }
}

testNonWaitMode();
import { sendUserMessage, exit_status } from '../../src/component/process/main_virtual';

async function main() {
    try {
        console.log('1. 初始 exit_status:', exit_status());
        console.log('');

        console.log('2. 调用 sendUserMessage...');
        const result = await sendUserMessage('你好！我是调试测试用户2。', 'DebugUser2');
        console.log('');
        console.log('sendUserMessage 返回:', result);
        console.log('');

        console.log('3. 最终 exit_status:', exit_status());

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

main();

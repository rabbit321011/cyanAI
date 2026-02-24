import { getCoreStateForFile, addMessageFromString, sendAll, exit_status } from '../../src/component/process/main_virtual';

async function main() {
    try {
        console.log('1. 初始化状态...');
        const initResult = getCoreStateForFile();
        console.log('初始化结果:', initResult);
        console.log('exit_status:', exit_status());
        console.log('');

        console.log('2. 添加用户消息...');
        const addResult = addMessageFromString('你好！我是调试测试用户。', 'user', 'DebugUser');
        console.log('添加消息结果:', addResult);
        console.log('');

        console.log('3. 调用 sendAll...');
        const sendResult = await sendAll();
        console.log('sendAll 结果:', sendResult);
        console.log('');

        console.log('4. 检查 exit_status...');
        console.log('exit_status:', exit_status());

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

main();

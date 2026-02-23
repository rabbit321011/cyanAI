import { getCoreStateForFile, addMessageFromString, sendAll } from '../../src/component/process/main_virtual';

async function main() {
    try {
        console.log('1. 初始化状态...');
        const initResult = getCoreStateForFile();
        console.log('初始化结果:', initResult);
        console.log('');

        console.log('2. 添加用户消息...');
        const addResult = addMessageFromString('你好！我是测试用户，请简单介绍一下自己。');
        console.log('添加消息结果:', addResult);
        console.log('');

        console.log('3. 调用 sendAll...');
        console.log('这可能需要几秒钟，请稍候...');
        console.log('');
        const sendResult = await sendAll();
        console.log('');
        console.log('sendAll 结果:', sendResult);

    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

main();

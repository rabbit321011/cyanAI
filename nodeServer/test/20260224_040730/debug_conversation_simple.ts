import { getCoreStateForFile, addMessageFromString, sendAll, verify_context, exit_status } from '../../src/component/process/main_virtual';

async function main() {
    try {
        console.log('========================================');
        console.log('🔍 CyanAI 连续对话调试');
        console.log('========================================');

        // 初始化
        console.log('\n--- 初始化状态 ---');
        getCoreStateForFile();
        console.log('exit_status():', exit_status());
        console.log('verify_context():', verify_context());

        // 第 1 轮
        console.log('\n--- 第 1 轮 ---');
        addMessageFromString('你好！我是测试用户。', 'user', 'TestUser');
        console.log('添加用户消息后，verify_context():', verify_context());
        const result1 = await sendAll();
        console.log('sendAll 结果:', result1);
        console.log('发送后，verify_context():', verify_context());

        // 第 2 轮
        console.log('\n--- 第 2 轮 ---');
        addMessageFromString('你还记得我是谁吗？', 'user', 'TestUser');
        console.log('添加用户消息后，verify_context():', verify_context());
        const result2 = await sendAll();
        console.log('sendAll 结果:', result2);
        console.log('发送后，verify_context():', verify_context());

        console.log('\n========================================');
        console.log('✅ 调试完成!');
        console.log('========================================');

    } catch (error) {
        console.error('❌ 调试失败:', error);
    }
}

main();

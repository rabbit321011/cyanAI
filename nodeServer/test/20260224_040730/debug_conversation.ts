import { getCoreStateForFile, addMessageFromString, sendAll, verify_context, exit_status, main_status } from '../../src/component/process/main_virtual';

function debugContext(label: string) {
    console.log(`\n=== ${label} ===`);
    console.log('main_status 存在:', !!main_status);
    if (main_status) {
        console.log('context 长度:', main_status.context.length);
        main_status.context.forEach((msg, i) => {
            console.log(`  [${i}] ${msg.role_type}: ${msg.current.substring(0, 30)}...`);
        });
        console.log('verify_context():', verify_context());
    }
}

async function main() {
    try {
        console.log('========================================');
        console.log('🔍 CyanAI 连续对话调试');
        console.log('========================================');

        // 初始化
        console.log('\n--- 初始化状态 ---');
        getCoreStateForFile();
        debugContext('初始化后');

        // 第 1 轮
        console.log('\n--- 第 1 轮 ---');
        addMessageFromString('你好！我是测试用户。', 'user', 'TestUser');
        debugContext('添加用户消息后，发送前');
        await sendAll();
        debugContext('发送后（第1轮结束）');

        // 第 2 轮
        console.log('\n--- 第 2 轮 ---');
        addMessageFromString('你还记得我是谁吗？', 'user', 'TestUser');
        debugContext('添加用户消息后，发送前');
        await sendAll();
        debugContext('发送后（第2轮结束）');

        console.log('\n========================================');
        console.log('✅ 调试完成!');
        console.log('========================================');

    } catch (error) {
        console.error('❌ 调试失败:', error);
    }
}

main();

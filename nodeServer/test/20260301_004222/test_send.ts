import { QQtrackRestart, QQsendMessage } from '../../src/utility/QQ/qq';

async function testSendMessage() {
    console.log('========== 测试发送消息 ==========\n');
    
    console.log('1. 启动 WebSocket 连接');
    const restartResult = await QQtrackRestart();
    console.log(`   结果: ${restartResult}\n`);
    
    if (restartResult.startsWith('ERROR')) {
        console.log('   连接失败，退出测试');
        return;
    }
    
    await sleep(1000);
    
    console.log('2. 给岛岛发送消息');
    const sendResult = await QQsendMessage('2926855205', '你好！这是一条测试消息，来自 cyanAI 的 QQ 模块测试。');
    console.log(`   结果: ${sendResult}\n`);
    
    console.log('========== 测试结束 ==========');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

testSendMessage().catch(console.error);

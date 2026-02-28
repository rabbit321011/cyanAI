import { QQtrackRestart, QQsendMessage, QQgetFriend, QQsendImg, QQsendAudio, QQtrackTextExecute, QQidleSignal } from '../../src/utility/QQ/qq';
import { get_busy } from '../../src/component/process/main_virtual';

async function testQQ() {
    console.log('========== QQ 模块测试开始 ==========\n');
    
    console.log('1. 测试 get_busy() - 初始状态');
    const initialBusy = get_busy();
    console.log(`   busy 状态: ${initialBusy}`);
    console.log(`   预期: false, 结果: ${initialBusy === false ? '✓ 通过' : '✗ 失败'}\n`);
    
    console.log('2. 测试 QQtrackRestart() - 启动 WebSocket 连接');
    console.log('   注意: 需要 OneBot 服务运行在 ws://127.0.0.1:4286');
    const restartResult = await QQtrackRestart();
    console.log(`   结果: ${restartResult}\n`);
    
    if (restartResult.startsWith('ERROR')) {
        console.log('   WebSocket 连接失败，后续测试可能无法通过');
        console.log('   请确保 OneBot 服务正在运行\n');
    }
    
    await sleep(1000);
    
    console.log('3. 测试 QQgetFriend() - 获取好友列表');
    const friendResult = await QQgetFriend();
    if (typeof friendResult === 'string') {
        console.log(`   结果: ${friendResult}`);
    } else {
        console.log(`   获取到 ${friendResult.length} 个好友`);
        friendResult.slice(0, 3).forEach((f, i) => {
            console.log(`   好友${i + 1}: ${f.name} (${f.qq_num})`);
        });
    }
    console.log('');
    
    console.log('4. 测试 QQtrackTextExecute() - busy=false 时');
    console.log('   注意: 这会调用 sendUserMessage，触发 LLM 请求');
    const textResult1 = QQtrackTextExecute('12345678', '测试用户', '这是一条测试消息');
    console.log(`   结果: ${textResult1}`);
    console.log('   (sendUserMessage 在后台异步执行中，需要等待 LLM 响应)\n');
    
    console.log('========== QQ 模块测试结束 ==========');
    console.log('提示: QQidleSignal 由 sendAll 结束时自动调用，无需手动测试');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

testQQ().catch(console.error);

// 简单测试 QQ 多 part 消息逻辑（不需要实际连接）
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    saveCoreStateForFile
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';

async function testQQMultipartSimple() {
    console.log("=== 测试 QQ 多 part 消息逻辑（简化版）===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 测试：添加多条消息（模拟 QQ 收到多条消息）
    console.log("\n3. 添加多条消息到队列...");
    
    // 消息 1: 纯文本
    const result1 = addQueueMessage("QQ联系人:测试用户A(123456)发来了消息:你好", "system");
    console.log("消息1:", result1);
    
    // 消息 2: 文本 + 图片
    const inline1: inlineData = { mimeType: "image/jpeg", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" };
    const result2 = addQueueMessage("QQ联系人:测试用户A(123456)发来了消息:看图片", "system", [], [inline1]);
    console.log("消息2:", result2);
    
    // 消息 3: 纯文本
    const result3 = addQueueMessage("QQ联系人:测试用户A(123456)发来了消息:还有文字", "system");
    console.log("消息3:", result3);
    
    // 保存状态
    console.log("\n4. 保存状态...");
    const saveResult = saveCoreStateForFile();
    console.log("保存结果:", saveResult);
    
    console.log("\n=== 测试完成 ===");
    console.log("请检查 core_datas/main_virtual/main_virtual.status 文件");
    console.log("预期：应该有 3 条 Message，其中第二条有 inlineData 字段");
    console.log("注意：这个测试没有调用 sendAll，所以没有验证合并逻辑");
}

// 运行测试
testQQMultipartSimple().catch(err => {
    console.error("测试出错:", err);
});

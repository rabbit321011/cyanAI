// 测试 sendAll 的合并逻辑
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    sendAll
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';

async function testSendAllMerge() {
    console.log("=== 测试 sendAll 合并逻辑 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 添加多条连续的 user 消息（模拟 QQ 收到多条消息）
    console.log("\n3. 添加多条连续的 user 消息...");
    
    // 消息 1: 纯文本
    const result1 = addQueueMessage("消息1", "user");
    console.log("消息1:", result1);
    
    // 消息 2: 文本 + 图片
    const inline1: inlineData = { mimeType: "image/jpeg", data: "base64data1" };
    const result2 = addQueueMessage("消息2", "user", [], [inline1]);
    console.log("消息2:", result2);
    
    // 消息 3: 纯文本
    const result3 = addQueueMessage("消息3", "user");
    console.log("消息3:", result3);
    
    // 消息 4: 纯文本
    const result4 = addQueueMessage("消息4", "user");
    console.log("消息4:", result4);
    
    // 保存状态（在 sendAll 之前）
    console.log("\n4. 保存状态（sendAll 之前）...");
    const saveResult1 = require('../../src/component/process/main_virtual').saveCoreStateForFile();
    console.log("保存结果:", saveResult1);
    
    // 调用 sendAll（会合并消息）
    console.log("\n5. 调用 sendAll（会合并消息）...");
    console.log("注意：sendAll 会调用 Google API，如果 API key 不正确会失败");
    console.log("但我们主要关注合并逻辑，所以即使 API 失败也没关系");
    
    try {
        const sendResult = await sendAll();
        console.log("sendAll 结果:", sendResult);
    } catch (error: any) {
        console.log("sendAll 错误:", error.message);
        console.log("（这是预期的，因为我们可能没有有效的 API key）");
    }
    
    // 保存状态（在 sendAll 之后）
    console.log("\n6. 保存状态（sendAll 之后）...");
    const saveResult2 = require('../../src/component/process/main_virtual').saveCoreStateForFile();
    console.log("保存结果:", saveResult2);
    
    console.log("\n=== 测试完成 ===");
    console.log("请检查 core_datas/main_virtual/main_virtual.status 文件");
    console.log("预期：sendAll 之前有 4 条 user 消息，sendAll 之后应该合并成 1 条");
    console.log("合并后的消息应该包含 4 个 parts：");
    console.log("  - part 1: text = 消息1");
    console.log("  - part 2: text = 消息2 + inlineData");
    console.log("  - part 3: text = 消息3");
    console.log("  - part 4: text = 消息4");
}

// 运行测试
testSendAllMerge().catch(err => {
    console.error("测试出错:", err);
});

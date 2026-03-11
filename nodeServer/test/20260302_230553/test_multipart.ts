// 测试多 part 消息合并功能
import {
    addQueueMessage,
    sendUserMessage,
    getCoreStateForFile,
    saveCoreStateForFile,
    removeCoreStateForFile,
    exit_status
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';

async function testMultipartMerge() {
    console.log("=== 测试多 part 消息合并功能 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 测试 addQueueMessage
    console.log("\n3. 测试 addQueueMessage - 添加多条消息到队列...");
    
    // 添加第一条消息
    const result1 = addQueueMessage("你好", "用户A");
    console.log("添加消息1:", result1);
    
    // 添加第二条消息（相同用户，应该合并）
    const inline1: inlineData = { mimeType: "image/jpeg", data: "base64data1" };
    const result2 = addQueueMessage("这是图片", "用户A", [], [inline1]);
    console.log("添加消息2(带图片):", result2);
    
    // 添加第三条消息（相同用户）
    const result3 = addQueueMessage("还有文字", "用户A");
    console.log("添加消息3:", result3);
    
    // 添加第四条消息（不同用户，不应该合并）
    const result4 = addQueueMessage("我是用户B", "用户B");
    console.log("添加消息4(不同用户):", result4);
    
    // 添加第五条消息（回到用户A）
    const inline2: inlineData = { mimeType: "image/png", data: "base64data2" };
    const result5 = addQueueMessage("用户A又来了", "用户A", [], [inline2]);
    console.log("添加消息5(用户A):", result5);
    
    // 保存状态查看
    console.log("\n4. 保存状态...");
    const saveResult = saveCoreStateForFile();
    console.log("保存结果:", saveResult);
    
    // 检查状态是否存在
    console.log("\n5. 检查状态...");
    const status = exit_status();
    console.log("状态存在:", status);
    
    console.log("\n=== 测试完成 ===");
    console.log("请检查 core_datas/main_virtual/main_virtual.status 文件查看消息结构");
}

// 运行测试
testMultipartMerge().catch(err => {
    console.error("测试出错:", err);
});

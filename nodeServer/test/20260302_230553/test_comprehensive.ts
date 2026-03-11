// 综合测试多 part 消息功能
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    sendAll,
    verify_context,
    verify_chatable,
    context_back,
    exit_status
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';

async function testComprehensive() {
    console.log("=== 综合测试多 part 消息功能 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 测试 verify_context - 空状态
    console.log("\n3. 测试 verify_context - 空状态...");
    const verifyEmpty = verify_context();
    console.log("空状态验证结果:", verifyEmpty, "(预期: false)");
    
    // 测试 verify_chatable - 空状态
    console.log("\n4. 测试 verify_chatable - 空状态...");
    const chatableEmpty = verify_chatable();
    console.log("空状态可聊天:", chatableEmpty, "(预期: false)");
    
    // 添加第一条消息（user）
    console.log("\n5. 添加第一条消息（user）...");
    const result1 = addQueueMessage("第一条消息", "user");
    console.log("结果:", result1);
    
    // 测试 verify_context - 第一条是 user
    console.log("\n6. 测试 verify_context - 第一条是 user...");
    const verify1 = verify_context();
    console.log("验证结果:", verify1, "(预期: true)");
    
    // 测试 verify_chatable - 最后一条是 user
    console.log("\n7. 测试 verify_chatable - 最后一条是 user...");
    const chatable1 = verify_chatable();
    console.log("可聊天:", chatable1, "(预期: true)");
    
    // 添加第二条消息（user，带图片）
    console.log("\n8. 添加第二条消息（user，带图片）...");
    const inline1: inlineData = { mimeType: "image/jpeg", data: "base64data1" };
    const result2 = addQueueMessage("第二条消息", "user", [], [inline1]);
    console.log("结果:", result2);
    
    // 添加第三条消息（user）
    console.log("\n9. 添加第三条消息（user）...");
    const result3 = addQueueMessage("第三条消息", "user");
    console.log("结果:", result3);
    
    // 测试 verify_context - 连续 user
    console.log("\n10. 测试 verify_context - 连续 user...");
    const verify2 = verify_context();
    console.log("验证结果:", verify2, "(预期: true，因为支持多 part)");
    
    // 测试 verify_chatable - 最后一条是 user
    console.log("\n11. 测试 verify_chatable - 最后一条是 user...");
    const chatable2 = verify_chatable();
    console.log("可聊天:", chatable2, "(预期: true)");
    
    // 添加第四条消息（不同用户）
    console.log("\n12. 添加第四条消息（不同用户）...");
    const result4 = addQueueMessage("第四条消息", "user");
    console.log("结果:", result4);
    
    // 测试 context_back - 最后一条是 user，不应该删除
    console.log("\n13. 测试 context_back - 最后一条是 user...");
    const back1 = context_back();
    console.log("回退结果:", back1, "(预期: SUCCESS:上下文已回退)");
    
    // 添加第五条消息（模拟 model，直接添加到 context）
    console.log("\n14. 添加第五条消息（模拟 model）...");
    const { addMessageFromString } = require('../../src/component/process/main_virtual');
    addMessageFromString("AI回复", "model", "cyanAI");
    console.log("已添加 model 消息");
    
    // 测试 verify_chatable - 最后一条是 model
    console.log("\n15. 测试 verify_chatable - 最后一条是 model...");
    const chatable3 = verify_chatable();
    console.log("可聊天:", chatable3, "(预期: false)");
    
    // 测试 context_back - 最后一条是 model，应该删除
    console.log("\n16. 测试 context_back - 最后一条是 model...");
    const back2 = context_back();
    console.log("回退结果:", back2, "(预期: SUCCESS:上下文已回退)");
    
    // 测试 verify_chatable - 删除后最后一条是 user
    console.log("\n17. 测试 verify_chatable - 删除后最后一条是 user...");
    const chatable4 = verify_chatable();
    console.log("可聊天:", chatable4, "(预期: true)");
    
    // 添加第六条消息（模拟 function）
    console.log("\n18. 添加第六条消息（模拟 function）...");
    addMessageFromString("", "function", "", [], [], [{
        name: "test_function",
        args: { param: "value" }
    }], [{
        name: "test_function",
        response: { result: "success" }
    }]);
    console.log("已添加 function 消息");
    
    // 测试 verify_chatable - 最后一条是 function
    console.log("\n19. 测试 verify_chatable - 最后一条是 function...");
    const chatable5 = verify_chatable();
    console.log("可聊天:", chatable5, "(预期: true)");
    
    // 测试 verify_context - function 后是 user
    console.log("\n20. 测试 verify_context - function 后是 user...");
    const verify3 = verify_context();
    console.log("验证结果:", verify3, "(预期: true)");
    
    // 保存状态
    console.log("\n21. 保存状态...");
    const saveResult = require('../../src/component/process/main_virtual').saveCoreStateForFile();
    console.log("保存结果:", saveResult);
    
    // 检查状态
    console.log("\n22. 检查状态...");
    const status = exit_status();
    console.log("状态存在:", status);
    
    console.log("\n=== 测试完成 ===");
    console.log("请检查 core_datas/main_virtual/main_virtual.status 文件");
    console.log("预期：应该有 6 条 Message，其中第二条有 inlineData");
}

// 运行测试
testComprehensive().catch(err => {
    console.error("测试出错:", err);
});

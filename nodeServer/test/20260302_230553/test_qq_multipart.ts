// 测试 QQ 多 part 消息功能
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    saveCoreStateForFile,
    exit_status
} from '../../src/component/process/main_virtual';
import { QQtrackTextExecute, QQidleSignal } from '../../src/utility/QQ/qq';
import { inlineData } from '../../src/types/process/process.type';

async function testQQMultipart() {
    console.log("=== 测试 QQ 多 part 消息功能 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 测试 1: 纯文本消息
    console.log("\n3. 测试 1: 纯文本消息...");
    const result1 = await QQtrackTextExecute("123456", "测试用户A", "你好，这是一条纯文本消息");
    console.log("结果:", result1);
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试 2: 文本 + 图片
    console.log("\n4. 测试 2: 文本 + 图片...");
    const inline1: inlineData = { mimeType: "image/jpeg", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" };
    const result2 = await QQtrackTextExecute("123456", "测试用户A", "看这张图片", [inline1]);
    console.log("结果:", result2);
    
    // 等待一下
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试 3: 多条消息（模拟 busy 状态）
    console.log("\n5. 测试 3: 模拟 busy 状态下的多条消息...");
    
    // 先添加一条消息（会触发 sendAll，让 main_virtual 变 busy）
    const result3 = await QQtrackTextExecute("123456", "测试用户A", "第一条消息");
    console.log("第一条消息结果:", result3);
    
    // 等待 sendAll 完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 现在添加多条消息到队列
    const inline2: inlineData = { mimeType: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" };
    const result4 = await QQtrackTextExecute("123456", "测试用户A", "第二条消息（带图片）", [inline2]);
    console.log("第二条消息结果:", result4);
    
    const result5 = await QQtrackTextExecute("123456", "测试用户A", "第三条消息");
    console.log("第三条消息结果:", result5);
    
    // 等待 sendAll 完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试 4: 处理队列
    console.log("\n6. 测试 4: 处理等待队列...");
    const idleResult = await QQidleSignal();
    console.log("处理队列结果:", idleResult);
    
    // 等待 sendAll 完成
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 保存状态
    console.log("\n7. 保存状态...");
    const saveResult = saveCoreStateForFile();
    console.log("保存结果:", saveResult);
    
    // 检查状态
    console.log("\n8. 检查状态...");
    const status = exit_status();
    console.log("状态存在:", status);
    
    console.log("\n=== 测试完成 ===");
    console.log("请检查 core_datas/main_virtual/main_virtual.status 文件查看消息结构");
    console.log("预期：应该有多条 Message，其中包含 inlineData 字段");
}

// 运行测试
testQQMultipart().catch(err => {
    console.error("测试出错:", err);
});

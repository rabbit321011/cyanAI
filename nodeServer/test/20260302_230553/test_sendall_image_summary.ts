// 测试 sendAll 的图片总结功能
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    saveCoreStateForFile,
    sendAll
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';
import fs from 'fs';
import path from 'path';

async function testSendAllImageSummary() {
    console.log("=== 测试 sendAll 图片总结功能 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 读取测试图片
    const imagePath = "C:\\Users\\jbbj\\Pictures\\Screenshots\\屏幕截图 2026-01-11 213709.png";
    console.log("\n3. 读取测试图片:", imagePath);
    
    if (!fs.existsSync(imagePath)) {
        console.error("图片不存在:", imagePath);
        return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    // 检测 MIME 类型
    let mimeType = 'image/png';
    const magic = imageBuffer.slice(0, 4);
    if (magic[0] === 0x89 && magic[1] === 0x50) {
        mimeType = 'image/png';
    } else if (magic[0] === 0xFF && magic[1] === 0xD8) {
        mimeType = 'image/jpeg';
    }
    console.log("检测到 MIME 类型:", mimeType);
    
    // 添加带图片的消息
    console.log("\n4. 添加带图片的消息...");
    const inline1: inlineData = { mimeType, data: base64 };
    const result1 = addQueueMessage("这是一张测试图片，请描述图片内容", "user", [], [inline1]);
    console.log("结果:", result1);
    
    // 保存状态（总结前）
    console.log("\n5. 保存状态（总结前）...");
    saveCoreStateForFile();
    
    // 检查状态文件
    const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
    const statusBefore = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const lastMessageBefore = statusBefore.context[statusBefore.context.length - 1];
    console.log("总结前最后一条消息:");
    console.log("  - current:", lastMessageBefore.current);
    console.log("  - inline 数量:", lastMessageBefore.inline?.length || 0);
    
    // 调用 sendAll（会触发图片总结）
    console.log("\n6. 调用 sendAll（会触发图片总结）...");
    console.log("注意：由于这是最近的图片且未过期，应该不会被总结");
    
    try {
        const sendResult = await sendAll();
        console.log("sendAll 结果:", sendResult);
    } catch (error: any) {
        console.log("sendAll 错误:", error.message);
    }
    
    // 保存状态（总结后）
    console.log("\n7. 保存状态（总结后）...");
    saveCoreStateForFile();
    
    // 检查状态文件
    const statusAfter = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const lastMessageAfter = statusAfter.context[statusAfter.context.length - 1];
    console.log("总结后最后一条消息:");
    console.log("  - current:", lastMessageAfter.current);
    console.log("  - inline 数量:", lastMessageAfter.inline?.length || 0);
    
    console.log("\n=== 测试完成 ===");
    console.log("预期：由于这是最近的图片且未过期，图片不会被总结");
    console.log("如果要测试总结功能，需要：");
    console.log("  1. 添加超过 7 张图片");
    console.log("  2. 或等待 10 分钟");
}

// 运行测试
testSendAllImageSummary().catch(err => {
    console.error("测试出错:", err);
});

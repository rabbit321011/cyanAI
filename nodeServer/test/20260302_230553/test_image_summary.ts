// 测试图片总结功能
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    saveCoreStateForFile
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';
import fs from 'fs';
import path from 'path';

async function testImageSummary() {
    console.log("=== 测试图片总结功能 ===\n");
    
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
    } else if (magic[0] === 0x47 && magic[1] === 0x49) {
        mimeType = 'image/gif';
    } else if (magic[0] === 0x52 && magic[1] === 0x49) {
        mimeType = 'image/webp';
    } else if (magic[0] === 0xFF && magic[1] === 0xD8) {
        mimeType = 'image/jpeg';
    }
    console.log("检测到 MIME 类型:", mimeType);
    console.log("图片大小:", (base64.length / 1024).toFixed(2), "KB (base64)");
    
    // 添加带图片的消息
    console.log("\n4. 添加带图片的消息...");
    const inline1: inlineData = { mimeType, data: base64 };
    const result1 = addQueueMessage("这是一张测试图片", "user", [], [inline1]);
    console.log("结果:", result1);
    
    // 保存状态
    console.log("\n5. 保存状态...");
    const saveResult = saveCoreStateForFile();
    console.log("保存结果:", saveResult);
    
    // 检查状态文件
    console.log("\n6. 检查状态文件...");
    const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
    if (fs.existsSync(statusPath)) {
        const statusContent = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        const lastMessage = statusContent.context[statusContent.context.length - 1];
        console.log("最后一条消息:");
        console.log("  - current:", lastMessage.current);
        console.log("  - inline 数量:", lastMessage.inline?.length || 0);
        if (lastMessage.inline && lastMessage.inline.length > 0) {
            console.log("  - inline[0].mimeType:", lastMessage.inline[0].mimeType);
            console.log("  - inline[0].data 长度:", lastMessage.inline[0].data.length);
        }
    }
    
    console.log("\n=== 测试完成 ===");
    console.log("接下来可以运行 sendAll 来测试图片总结功能");
    console.log("预期：如果图片超过 10 分钟或不是最近 7 张，会被总结为文本");
}

// 运行测试
testImageSummary().catch(err => {
    console.error("测试出错:", err);
});

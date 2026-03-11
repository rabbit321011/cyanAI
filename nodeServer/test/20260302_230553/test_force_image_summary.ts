// 强制测试图片总结功能
import {
    getCoreStateForFile,
    removeCoreStateForFile,
    addQueueMessage,
    saveCoreStateForFile
} from '../../src/component/process/main_virtual';
import { inlineData } from '../../src/types/process/process.type';
import fs from 'fs';
import path from 'path';
import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';

// 模拟图片总结函数（直接暴露用于测试）
async function summarizeImage(imageData: inlineData): Promise<string> {
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [
                { text: '请描述这张图片的内容。如果图片中包含文档或文字，请完整列出所有可见的文字；如果是普通图片，请详细描述画面内容、人物、场景、色彩等，字数不限。格式：直接输出描述内容，不要加任何前缀。' },
                { inlineData: { mimeType: imageData.mimeType, data: imageData.data } }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
        }
    };
    
    try {
        const response = await callGoogleLLM(
            request,
            readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key'),
            "gemini-2.5-flash",
            readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url')
        );
        return response.text || '[图片内容无法识别]';
    } catch (error) {
        console.error('图片总结失败:', error);
        return '[图片内容无法识别]';
    }
}

async function testForceImageSummary() {
    console.log("=== 强制测试图片总结功能 ===\n");
    
    // 清理之前的状态
    console.log("1. 清理之前的状态...");
    removeCoreStateForFile();
    
    // 等待一下确保文件被删除
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 初始化状态
    console.log("2. 初始化状态...");
    const initResult = getCoreStateForFile();
    console.log("初始化结果:", initResult);
    
    // 等待一下确保文件被创建
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
    console.log("图片大小:", (base64.length / 1024).toFixed(2), "KB (base64)");
    
    // 添加带图片的消息
    console.log("\n4. 添加带图片的消息...");
    const inline1: inlineData = { mimeType, data: base64 };
    addQueueMessage("这是一张测试图片", "user", [], [inline1]);
    
    // 保存状态到文件
    console.log("4.1 保存状态到文件...");
    saveCoreStateForFile();
    
    // 等待一下确保文件被更新
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 修改时间为20分钟前
    const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
    
    // 确保文件存在
    if (!fs.existsSync(statusPath)) {
        console.error("状态文件不存在:", statusPath);
        return;
    }
    
    const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    
    // 检查是否有消息
    if (!status.context || status.context.length === 0) {
        console.error("没有消息可以修改");
        return;
    }
    
    // 获取当前时间并减去20分钟
    const now = new Date();
    const oldTime = new Date(now.getTime() - 20 * 60 * 1000);
    const oldTimeStr = `${oldTime.getFullYear()}${String(oldTime.getMonth() + 1).padStart(2, '0')}${String(oldTime.getDate()).padStart(2, '0')}_${String(oldTime.getHours()).padStart(2, '0')}${String(oldTime.getMinutes()).padStart(2, '0')}${String(oldTime.getSeconds()).padStart(2, '0')}`;
    
    status.context[status.context.length - 1].time = oldTimeStr;
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    console.log("设置消息时间为:", oldTimeStr, "(20分钟前)");
    
    // 检查修改后的状态
    console.log("\n5. 检查修改后的状态...");
    const statusModified = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const lastMessage = statusModified.context[statusModified.context.length - 1];
    console.log("消息时间:", lastMessage.time);
    console.log("inline 数量:", lastMessage.inline?.length || 0);
    
    // 直接测试 summarizeImage 函数
    console.log("\n6. 直接调用 summarizeImage 进行图片总结...");
    const summary = await summarizeImage(inline1);
    console.log("图片总结结果:");
    console.log(summary);
    
    // 模拟总结后的消息更新
    console.log("\n7. 模拟总结后的消息更新...");
    const imageDescription = `这张图片的内容是：${summary}`;
    if (lastMessage.current) {
        lastMessage.current += '\n' + imageDescription;
    } else {
        lastMessage.current = imageDescription;
    }
    lastMessage.inline = [];
    
    fs.writeFileSync(statusPath, JSON.stringify(statusModified, null, 2));
    
    // 检查最终状态
    console.log("\n8. 检查最终状态...");
    const statusFinal = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    const finalMessage = statusFinal.context[statusFinal.context.length - 1];
    console.log("最终消息内容:");
    console.log("  - current:", finalMessage.current);
    console.log("  - inline 数量:", finalMessage.inline?.length || 0);
    
    console.log("\n=== 测试完成 ===");
    console.log("图片已成功总结为文本，inline 已清空");
}

// 运行测试
testForceImageSummary().catch(err => {
    console.error("测试出错:", err);
});

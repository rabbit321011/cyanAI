import express from "express";
import cors from "cors";
import agentRouter from "./routes/agent.route";
import cyanRouter from "./routes/cyan.route"
import { QQtrackRestart } from "./utility/QQ/qq";
import { init as pipeInit } from "./component/pipe/pipe";
import { init as mainVirtualInit } from "./component/process/main_virtual";
import { readIni } from "./utility/file_operation/read_ini";
import path from "path";
import WebSocket from "ws";

async function checkQQWsExists(): Promise<boolean> {
  const wsPath = readIni(path.join(__dirname, '../library_source.ini'), 'QQ_wsPath');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${wsPath}/api`);
    ws.on('open', () => {
      ws.close();
      resolve(true);
    });
    ws.on('error', () => {
      resolve(false);
    });
  });
}
const app = express();
const PORT = 3000;

// === 1. 全局中间件 (类似于红石全局锁存器) ===
app.use(cors());                 // 允许跨域 (Vue 才能访问)
app.use(express.json());         // 自动解析 JSON (否则 req.body 是 undefined)

// === 2. 挂载路由 ===
// 所有 agent 相关的接口，都挂在 /api/agent 下面
// 比如: /api/agent/chat, /api/agent/status
app.use("/api/agent", agentRouter);
app.use("/api/cyan",cyanRouter);
// === 3. 启动服务器 ===
app.listen(PORT, async () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on Port ${PORT}`);
  console.log(`👉 Test: http://localhost:${PORT}/api/agent/status`);
  console.log(`=================================`);
  
  try {
    await pipeInit();
    console.log(`🔧 Pipe 系统初始化完成`);
    
    await mainVirtualInit();
    console.log(`📋 策略组加载完成`);
    
    const qqServerPath = readIni(path.join(__dirname, '../library_source.ini'), 'QQ_server_path');
    if (qqServerPath) {
      const wsExists = await checkQQWsExists();
      if (wsExists) {
        console.log(`📱 QQ WebSocket 服务已存在，跳过启动`);
      } else {
        console.log(`📱 正在启动 QQ 服务: ${qqServerPath}`);
        const { spawn } = await import('child_process');
        const pathLib = await import('path');
        const batDir = pathLib.dirname(qqServerPath);
        const batFile = pathLib.basename(qqServerPath);
        spawn('cmd', ['/c', 'start', 'cmd', '/c', 'chcp', '65001', '&&', 'cd', '/d', batDir, '&&', batFile], { detached: true, stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 15000));
        console.log(`📱 QQ 服务已启动`);
      }
    }
    
    const qqResult = await QQtrackRestart();
    console.log(`📱 QQ 监听服务: ${qqResult}`);
  } catch (error) {
    console.error(`初始化失败:`, error);
  }
});
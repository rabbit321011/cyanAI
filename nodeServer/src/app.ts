import express from "express";
import cors from "cors";
import agentRouter from "./routes/agent.route";

const app = express();
const PORT = 3000;

// === 1. 全局中间件 (类似于红石全局锁存器) ===
app.use(cors());                 // 允许跨域 (Vue 才能访问)
app.use(express.json());         // 自动解析 JSON (否则 req.body 是 undefined)

// === 2. 挂载路由 ===
// 所有 agent 相关的接口，都挂在 /api/agent 下面
// 比如: /api/agent/chat, /api/agent/status
app.use("/api/agent", agentRouter);

// === 3. 启动服务器 ===
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Server running on Port ${PORT}`);
  console.log(`👉 Test: http://localhost:${PORT}/api/agent/status`);
  console.log(`=================================`);
});
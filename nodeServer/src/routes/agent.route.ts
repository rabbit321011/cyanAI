import { Router } from "express";
import { AgentController } from "../controllers/agent.controller";

const router = Router();
const agentController = new AgentController();

// === 定义路由表 ===

// POST http://localhost:3000/api/agent/chat
// 意思是：当收到 POST 请求，且路径匹配，就让 agentController 的 chat 方法去处理
router.post("/chat", agentController.chat);

// 你也可以加个 GET 测试用
router.get("/status", (req, res) => {
  res.send("Agent is online!");
});

export default router;
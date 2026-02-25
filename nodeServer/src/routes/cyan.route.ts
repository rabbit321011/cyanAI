import { Router } from "express";
import { CyanController } from "../controllers/cyan.controller";
const router = Router();
const cyanController = new CyanController();

// === 定义路由表 ===

// POST http://localhost:3000/api/cyan/chat
// 意思是：当收到 POST 请求，且路径匹配，就让 agentController 的 chat 方法去处理
router.post("/exit", cyanController.controller_exit_status);
router.post("/send", cyanController.controller_send_message);
router.post("/closeEvent",cyanController.controller_close_event);
export default router;
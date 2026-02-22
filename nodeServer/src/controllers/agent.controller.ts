import { Request, Response } from "express";
import { AgentService } from "../services/agent.service";

// 实例化 Service (相当于造了一台机器)
const agentService = new AgentService();

export class AgentController {
  
  // 处理函数: handleChat
  async chat(req: Request, res: Response) {
    try {
      // 1. 【防呆检查】
      // 从 req.body 里拿数据。如果前端传的是空，或者没传 message，直接报错
      const body = req.body;
      if (!body || !body.message) {
        // 400 Bad Request: 你请求有问题
        res.status(400).json({ error: "参数错误: 必须包含 message 字段" });
        return; 
      }

      // 2. 【调用核心】
      // 这里的 await 就像是在等红石信号传回来
      const result = await agentService.think({
        message: body.message,
        userId: body.userId
      });

      // 3. 【打包返回】
      res.json(result);

    } catch (error) {
      // 4. 【容错处理】
      // 万一 Service 炸了，不能让整个服务器崩掉，要返回 500
      console.error(error);
      res.status(500).json({ error: "服务器内部错误" });
    }
  }
}
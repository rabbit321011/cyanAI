import { ChatRequest, ChatResponse } from "../types/agent.types";

export class AgentService {
  /**
   * 核心思考函数
   * 输入: ChatRequest (纯数据)
   * 输出: Promise<ChatResponse> (纯数据)
   */
  async think(input: ChatRequest): Promise<ChatResponse> {
    // 1. 模拟一个思考过程 (就像红石中继器延时)
    console.log(`[Service] 正在思考: ${input.message}`);
    
    // 这里以后会换成调用 OpenAI/Gemini 的代码
    // 现在先用模拟数据占位
    const mockReply = `你的消息 "${input.message}" 我收到了。我是 Agent 007。`;
    
    // 模拟耗时 1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 返回结果
    return {
      reply: mockReply,
      timestamp: Date.now()
    };
  }
}
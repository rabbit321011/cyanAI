// src/types/agent.types.ts
// 定义：输入只能是这个样子，输出只能是那个样子

export interface ChatRequest {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  reply: string;
  timestamp: number;
}

export interface MemoryState {
  R: number;
  S: number;
  last_T_distance: number;
  D: number;
  a: number;
  timeset: string;
}
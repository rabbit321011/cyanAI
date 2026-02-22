// google_call.ts
import axios from 'axios';

// ==========================================
// 1. 类型定义 (Types & Interfaces)
// ==========================================

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  responseSchema?: any; 
}

export interface Tool {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: any; 
  }>;
}

export interface Part {
  text?: string;
  inlineData?: { mimeType: string; data: string }; 
  functionCall?: { name: string; args: any };
  functionResponse?: { name: string; response: any };
}

export interface Content {
  role: 'user' | 'model' | 'function'; 
  parts: Part[];
}

export interface EasyGeminiRequest {
  contents: Content[];
  systemInstruction?: string;    
  generationConfig?: GenerationConfig;
  tools?: Tool[];
}

export interface EasyGeminiResponse {
  text: string;                             
  functionCalls?: Array<{                   
    name: string;
    args: any;
  }>;
  rawResponse?: any;                        
}

/** 新增：New API 令牌用量查询的返回结构 */
export interface TokenUsageResponse {
  code: boolean;
  message: string;
  data?: {
    object: string;
    name: string;
    total_granted: number;   // 授予总量
    total_used: number;      // 已使用额度
    total_available: number; // 可用剩余额度
    unlimited_quota: boolean;
    model_limits: Record<string, boolean>;
    model_limits_enabled: boolean;
    expires_at: number;
  };
}

// ==========================================
// 2. 常量配置
// ==========================================

const MINIMAL_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
];

// 智能清理中转 URL 的通用方法
const cleanUrl = (url: string) => url.replace(/\/v1\/?$/, '').replace(/\/+$/, '');

// ==========================================
// 3. 核心功能函数
// ==========================================

/**
 * [功能 1] 向 Google Gemini 发送请求 (支持多模态和函数调用)
 */
export async function callGoogleLLM(
  request: EasyGeminiRequest,
  apiKey: string,
  model: string = 'gemini-2.0-flash', 
  baseUrl: string = 'https://generativelanguage.googleapis.com'
): Promise<EasyGeminiResponse> {
  
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: request.contents,
    safetySettings: MINIMAL_SAFETY_SETTINGS,
  };

  if (request.systemInstruction) {
    payload.systemInstruction = { parts: [{ text: request.systemInstruction }] };
  }
  if (request.generationConfig) { payload.generationConfig = request.generationConfig; }
  if (request.tools && request.tools.length > 0) { payload.tools = request.tools; }

  const headers: any = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}` 
  };

  try {
    const response = await axios.post(url, payload, { headers });
    const responseData = response.data;
    const parts = responseData?.candidates?.[0]?.content?.parts || [];
    
    const result: EasyGeminiResponse = { text: '', rawResponse: responseData };
    const extractedFunctionCalls: Array<{ name: string; args: any }> = [];

    for (const part of parts) {
      if (part.text) result.text += part.text; 
      if (part.functionCall) {
        extractedFunctionCalls.push({ name: part.functionCall.name, args: part.functionCall.args });
      }
    }

    if (extractedFunctionCalls.length > 0) result.functionCalls = extractedFunctionCalls;
    return result;

  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ LLM API 请求失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`请求大模型失败: ${error.message}`);
  }
}

/**
 * [功能 2] 获取当前 API Key 可用的模型列表
 * 说明：使用标准的 /v1/models 接口，最适配 sk- 开头的 API Key
 */
export async function getAvailableModels(
  apiKey: string,
  baseUrl: string
): Promise<string[]> {
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/v1/models`;

  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    // 从标准 OpenAI 格式中提取模型名称，返回纯字符串数组
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((model: any) => model.id);
    }
    return [];
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ 获取模型列表失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`获取模型列表失败: ${error.message}`);
  }
}

/**
 * [功能 3] 获取当前 API Key 的额度使用情况 (New API 专属)
 */
export async function getTokenUsage(
  apiKey: string,
  baseUrl: string
): Promise<TokenUsageResponse> {
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/api/usage/token`;

  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data;
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ 获取令牌额度失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`获取令牌额度失败: ${error.message}`);
  }
}

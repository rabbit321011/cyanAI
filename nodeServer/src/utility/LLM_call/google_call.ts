// google_call.ts
import axios from 'axios';
import { getApiKeyManager } from '../error_type/api_key_manager';
import { getErrorClassifier } from '../error_type/error_classifier';

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
  inlineData?: { 
    mimeType: string; 
    data: string; 
  };
  fileData?: { 
    mimeType: string; 
    fileUri: string; 
  };
  functionCall?: { 
    name: string; 
    args: any; 
  };
  functionResponse?: { 
    name: string; 
    response: any; 
  };
  executableCode?: { 
    language: 'PYTHON' | string; 
    code: string; 
  };
  codeExecutionResult?: { 
    outcome: 'OUTCOME_OK' | 'OUTCOME_FAILED' | string; 
    output: string; 
  };
  thoughtSignature?: string;
}

export interface Content {
  role: string; 
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
    thoughtSignature?: string;
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
    equivalent_balance?: number; // 等效余额（人民币）
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
 * [功能 1] 向 Google Gemini 发送请求 (支持多模态和函数调用，带故障转移)
 */
export async function callGoogleLLM(
  request: EasyGeminiRequest,
  apiKey?: string,
  model: string = 'gemini-2.0-flash', 
  baseUrl?: string
): Promise<EasyGeminiResponse> {
  
  const keyManager = getApiKeyManager();
  const errorClassifier = getErrorClassifier();
  
  let lastError: Error | null = null;
  let attempts = 0;
  const maxAttempts = 3; // 每个 key 最多重试 3 次
  
  while (true) {
    const currentKey = keyManager.getCurrentKey();
    
    if (!currentKey) {
      console.error('❌ 没有可用的 API key');
      throw lastError || new Error('没有可用的 API key');
    }
    
    // 使用传入的参数或当前 key 的配置
    const useApiKey = apiKey || currentKey.key;
    const useBaseUrl = baseUrl || currentKey.baseUrl;
    
    const cleanBaseUrl = cleanUrl(useBaseUrl);
    const url = `${cleanBaseUrl}/v1beta/models/${model}:generateContent?key=${useApiKey}`;

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
      'Authorization': `Bearer ${useApiKey}` 
    };

    console.log(`开始调用 Gemini 模型 (Key 优先级: ${currentKey.priority}, 尝试: ${attempts + 1})`);
    
    const TIMEOUT_MS = 90000; // 90秒超时
    const PROGRESS_INTERVAL = 15000; // 每15秒打印一次进度
    
    // 创建进度日志定时器
    let elapsedTime = 0;
    const progressTimer = setInterval(() => {
      elapsedTime += PROGRESS_INTERVAL;
      const elapsedSeconds = elapsedTime / 1000;
      const totalSeconds = TIMEOUT_MS / 1000;
      console.log(`超时时间：${elapsedSeconds}/${totalSeconds}`);
    }, PROGRESS_INTERVAL);
    
    try {
      const response = await axios.post(url, payload, { headers, timeout: TIMEOUT_MS });
      
      // 请求成功，清除定时器
      clearInterval(progressTimer);
      const responseData = response.data;
      const parts = responseData?.candidates?.[0]?.content?.parts || [];
      
      const result: EasyGeminiResponse = { text: '', rawResponse: responseData };
      const extractedFunctionCalls: Array<{ name: string; args: any; thoughtSignature?: string }> = [];

      for (const part of parts) {
        if (part.text) result.text += part.text; 
        if (part.functionCall) {
          extractedFunctionCalls.push({ 
            name: part.functionCall.name, 
            args: part.functionCall.args,
            thoughtSignature: part.thoughtSignature
          });
        }
      }

      if (extractedFunctionCalls.length > 0) result.functionCalls = extractedFunctionCalls;

      // 显示 token 使用情况
      const usageMetadata = responseData?.usageMetadata || responseData?.usage || {};
      if (usageMetadata) {
        console.log('💾 Token 使用情况:');
        const usdPerToken = 600 / 300000000;
        
        if (usageMetadata.promptTokenCount !== undefined) {
          const promptTokens = usageMetadata.promptTokenCount;
          const promptCny = promptTokens * usdPerToken * (80 / 600);
          console.log('  输入 Token:', promptTokens + '(￥' + promptCny.toFixed(6) + ')');
        }
        
        if (usageMetadata.candidatesTokenCount !== undefined) {
          const outputTokens = usageMetadata.candidatesTokenCount;
          const outputCny = outputTokens * usdPerToken * (80 / 600);
          console.log('  输出 Token:', outputTokens + '(￥' + outputCny.toFixed(6) + ')');
        }
        
        if (usageMetadata.totalTokenCount !== undefined) {
          const totalTokens = usageMetadata.totalTokenCount;
          const totalCny = totalTokens * usdPerToken * (80 / 600);
          console.log('  总计 Token:', totalTokens + '(￥' + totalCny.toFixed(6) + ')');
        }
      }

      console.log('✅ 结束调用 Gemini 模型');
      return result;

    } catch (error: any) {
      // 请求失败或出错，清除定时器
      clearInterval(progressTimer);
      
      attempts++;
      lastError = error;
      
      const classifiedError = errorClassifier.classifyError(error);
      const errorDetails = error?.response?.data || error.message;
      
      console.error(`❌ LLM API 请求失败 (Key 优先级: ${currentKey.priority}):`, classifiedError.message);
      console.error('错误详情:', JSON.stringify(errorDetails, null, 2));
      
      if (classifiedError.action === 'switch_api') {
        console.log(`🔄 错误类型需要切换 API: ${classifiedError.message}`);
        const nextKey = keyManager.switchToNextKey();
        
        if (!nextKey) {
          console.error('❌ 所有 API key 都不可用');
          throw new Error(`所有 API key 都不可用。最后错误: ${classifiedError.message}`);
        }
        
        console.log(`✅ 已切换到 API key ${nextKey.priority}`);
        attempts = 0; // 重置尝试次数
        continue; // 使用新 key 重试
      }
      
      if (classifiedError.action === 'retry') {
        if (attempts < maxAttempts) {
          console.log(`🔄 可重试错误，${attempts}/${maxAttempts} 次尝试`);
          const delay = Math.pow(2, attempts) * 1000; // 指数退避
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // 重试当前 key
        } else {
          console.log(`🔄 重试次数已用尽，切换 API`);
          const nextKey = keyManager.switchToNextKey();
          
          if (!nextKey) {
            console.error('❌ 所有 API key 都不可用');
            throw new Error(`所有 API key 都不可用。最后错误: ${classifiedError.message}`);
          }
          
          console.log(`✅ 已切换到 API key ${nextKey.priority}`);
          attempts = 0; // 重置尝试次数
          continue; // 使用新 key 重试
        }
      }
      
      // 不可重试的错误类型，直接抛出
      throw new Error(`请求大模型失败: ${classifiedError.message}`);
    }
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
 * @param apiKey API 密钥
 * @param baseUrl API 基础 URL
 * @param keyValue 该 API Key 的总价值（人民币），用于计算等效余额
 */
export async function getTokenUsage(
  apiKey: string,
  baseUrl: string,
  keyValue?: number
): Promise<TokenUsageResponse> {
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/api/usage/token`;

  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    const result: TokenUsageResponse = response.data;
    
    // 如果提供了 keyValue 且数据有效，计算等效余额
    if (keyValue && result.code && result.data) {
      const data = result.data;
      if (data.unlimited_quota) {
        // 无限额度时，等效余额等于总价值
        data.equivalent_balance = keyValue;
      } else if (data.total_granted > 0) {
        // 等效余额 = (剩余 token / 总授予 token) * 该 Key 的总价值
        data.equivalent_balance = parseFloat(
          ((data.total_available / data.total_granted) * keyValue).toFixed(4)
        );
      }
    }
    
    return result;
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ 获取令牌额度失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`获取令牌额度失败: ${error.message}`);
  }
}

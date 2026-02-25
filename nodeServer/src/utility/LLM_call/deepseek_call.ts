import axios from 'axios';

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: any;
}

export interface Tool {
  type: 'function';
  function: FunctionDeclaration;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface GenerationConfig {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

export interface DeepSeekRequest {
  messages: Message[];
  model?: string;
  tools?: Tool[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
  stream?: boolean;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface Choice {
  index: number;
  message: {
    role: 'assistant';
    content: string | null;
    tool_calls?: ToolCall[];
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface EasyDeepSeekResponse {
  text: string;
  functionCalls?: Array<{
    name: string;
    args: any;
  }>;
  usage?: Usage;
  rawResponse?: any;
}

const cleanUrl = (url: string) => url.replace(/\/v1\/?$/, '').replace(/\/+$/, '');

export async function callDeepSeekLLM(
  request: DeepSeekRequest,
  apiKey: string,
  model: string = 'deepseek-chat',
  baseUrl: string = 'https://api.deepseek.com'
): Promise<EasyDeepSeekResponse> {
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/chat/completions`;

  const payload: any = {
    model: model,
    messages: request.messages,
    stream: false
  };

  if (request.tools && request.tools.length > 0) {
    payload.tools = request.tools;
  }
  if (request.temperature !== undefined) {
    payload.temperature = request.temperature;
  }
  if (request.top_p !== undefined) {
    payload.top_p = request.top_p;
  }
  if (request.max_tokens !== undefined) {
    payload.max_tokens = request.max_tokens;
  }
  if (request.response_format) {
    payload.response_format = request.response_format;
  }

  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  try {
    const response = await axios.post(url, payload, { headers });
    const responseData: DeepSeekResponse = response.data;

    const result: EasyDeepSeekResponse = {
      text: '',
      rawResponse: responseData,
      usage: responseData.usage
    };

    const extractedFunctionCalls: Array<{ name: string; args: any }> = [];

    if (responseData.choices && responseData.choices.length > 0) {
      const choice = responseData.choices[0];
      if (choice.message.content) {
        result.text = choice.message.content;
      }
      if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            extractedFunctionCalls.push({
              name: toolCall.function.name,
              args: args
            });
          } catch (e) {
            extractedFunctionCalls.push({
              name: toolCall.function.name,
              args: toolCall.function.arguments
            });
          }
        }
      }
    }

    if (extractedFunctionCalls.length > 0) {
      result.functionCalls = extractedFunctionCalls;
    }

    return result;

  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ DeepSeek API 请求失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`请求大模型失败: ${error.message}`);
  }
}

export async function getAvailableModels(
  apiKey: string,
  baseUrl: string
): Promise<string[]> {
  const cleanBaseUrl = cleanUrl(baseUrl);
  const url = `${cleanBaseUrl}/models`;

  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

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

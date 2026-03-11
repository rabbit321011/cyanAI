import axios from 'axios';
import { EasyGeminiRequest, EasyGeminiResponse } from '../LLM_call/google_call';

export async function callDeepSeekTemp(
  request: EasyGeminiRequest,
  apiKey: string,
  model: string = 'deepseek-chat',
  baseUrl: string = 'https://api.deepseek.com'
): Promise<EasyGeminiResponse> {
  const url = `${baseUrl}/chat/completions`;
  
  const messages: Array<any> = [];
  
  if (request.systemInstruction) {
    messages.push({
      role: 'system',
      content: request.systemInstruction
    });
  }
  
  let toolCallIdCounter = 0;
  const toolCallIdMap = new Map<string, string>();
  
  for (const content of request.contents) {
    const hasFunctionCall = content.parts.some(p => p.functionCall);
    const hasFunctionResponse = content.parts.some(p => p.functionResponse);
    
    if (hasFunctionCall) {
      const assistantMessage: any = { role: 'assistant', content: null, tool_calls: [] };
      
      for (const part of content.parts) {
        if (part.functionCall) {
          const originalName = part.functionCall.name;
          const safeName = originalName.replace(/:/g, '_');
          const toolCallId = `call_${toolCallIdCounter++}`;
          toolCallIdMap.set(originalName, toolCallId);
          
          assistantMessage.tool_calls.push({
            id: toolCallId,
            type: 'function',
            function: {
              name: safeName,
              arguments: JSON.stringify(part.functionCall.args || {})
            }
          });
        }
        if (part.text) {
          assistantMessage.content = part.text;
        }
      }
      
      messages.push(assistantMessage);
    } else if (hasFunctionResponse) {
      for (const part of content.parts) {
        if (part.functionResponse) {
          const originalName = part.functionResponse.name;
          const toolCallId = toolCallIdMap.get(originalName) || `call_${toolCallIdCounter++}`;
          
          let responseContent: string;
          if (typeof part.functionResponse.response === 'string') {
            responseContent = part.functionResponse.response;
          } else {
            responseContent = JSON.stringify(part.functionResponse.response);
          }
          
          messages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: responseContent
          });
        }
      }
    } else {
      let role = 'user';
      if (content.role === 'model') {
        role = 'assistant';
      }
      
      const textParts: string[] = [];
      const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      for (const part of content.parts) {
        if (part.text) {
          textParts.push(part.text);
          contentParts.push({ type: 'text', text: part.text });
        }
        if (part.inlineData) {
          contentParts.push({
            type: 'image_url',
            image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
          });
        }
      }
      
      if (contentParts.length > 1 || contentParts.some(p => p.type === 'image_url')) {
        messages.push({ role, content: contentParts });
      } else {
        messages.push({ role, content: textParts.join('') });
      }
    }
  }
  
  const payload: any = {
    model: model,
    messages: messages,
  };
  
  if (request.generationConfig) {
    if (request.generationConfig.temperature !== undefined) {
      payload.temperature = request.generationConfig.temperature;
    }
    if (request.generationConfig.maxOutputTokens !== undefined) {
      payload.max_tokens = request.generationConfig.maxOutputTokens;
    }
    if (request.generationConfig.topP !== undefined) {
      payload.top_p = request.generationConfig.topP;
    }
  }
  
  if (request.tools && request.tools.length > 0) {
    payload.tools = [];
    for (const tool of request.tools) {
      for (const func of tool.functionDeclarations) {
        const safeName = func.name.replace(/:/g, '_');
        payload.tools.push({
          type: 'function',
          function: {
            name: safeName,
            description: func.description,
            parameters: func.parameters
          }
        });
      }
    }
  }
  
  const headers: any = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  console.log('开始调用 DeepSeek 模型');
  try {
    const response = await axios.post(url, payload, { headers });
    const responseData = response.data;
    
    const result: EasyGeminiResponse = { text: '', rawResponse: responseData };
    
    const choice = responseData.choices?.[0];
    if (choice) {
      const message = choice.message;
      
      if (message.content) {
        result.text = message.content;
      }
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        result.functionCalls = message.tool_calls.map((tc: any) => ({
          name: tc.function.name.replace(/^default_api_/, 'default_api:'),
          args: JSON.parse(tc.function.arguments || '{}')
        }));
      }
    }
    
    const usage = responseData.usage || {};
    if (usage) {
      console.log('💾 Token 使用情况:');
      if (usage.prompt_tokens !== undefined) {
        console.log('  输入 Token:', usage.prompt_tokens);
      }
      if (usage.completion_tokens !== undefined) {
        console.log('  输出 Token:', usage.completion_tokens);
      }
      if (usage.total_tokens !== undefined) {
        console.log('  总计 Token:', usage.total_tokens);
      }
    }
    
    console.log('结束调用 DeepSeek 模型');
    return result;
    
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error("❌ DeepSeek API 请求失败:", JSON.stringify(errorDetails, null, 2));
    throw new Error(`DeepSeek 请求失败: ${error.message}`);
  }
}

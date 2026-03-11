import { callGoogleLLM, EasyGeminiRequest } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testAPI2FunctionCall() {
  console.log('=== 测试第二个 API 的 functionCall 返回格式 ===\n');
  
  // 构建测试请求
  const request: EasyGeminiRequest = {
    systemInstruction: '你是一个 helpful assistant，能够使用工具来完成任务。当用户要求发送消息时，请使用 send_QQ_message 工具。',
    contents: [
      {
        role: 'user',
        parts: [
          { text: '帮我发送一条消息给QQ号1234567890，内容是：你好，这是一条测试消息' }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000
    },
    tools: [
      {
        functionDeclarations: [
          {
            name: 'default_api:send_QQ_message',
            description: '向指定的QQ号发送消息',
            parameters: {
              type: 'object',
              properties: {
                requirement_text: { 
                  type: 'string', 
                  description: '消息内容' 
                },
                wait_mode: { 
                  type: 'boolean', 
                  description: '是否等待执行完成' 
                }
              },
              required: ['requirement_text']
            }
          }
        ]
      }
    ]
  };

  console.log('📝 发送请求...');
  console.log('📋 Tools 配置:', JSON.stringify(request.tools, null, 2));
  
  try {
    // 检查 library_source.ini 文件是否存在
    const iniPath = path.join(__dirname, '../../library_source.ini');
    console.log('\n📁 配置文件路径:', iniPath);
    console.log('📁 文件是否存在:', fs.existsSync(iniPath));
    
    // 读取第二个 API 的配置
    const apiKey2 = readIni(iniPath, 'google_api_key_2') || readIni(iniPath, 'google_api_key');
    const baseUrl2 = readIni(iniPath, 'google_base_url_2') || readIni(iniPath, 'google_base_url');
    
    console.log('\n🔑 API Key 2:', apiKey2 ? apiKey2.substring(0, 10) + '...' : '未设置');
    console.log('🌐 Base URL 2:', baseUrl2);
    
    // 发送请求到第二个 API
    console.log('\n📤 发送请求到第二个 API...');
    const response = await callGoogleLLM(
      request,
      apiKey2,
      'gemini-3-pro-preview',  // 使用你配置中可用的模型
      baseUrl2
    );
    
    console.log('\n✅ 请求成功');
    console.log('\n📊 完整响应结构:');
    console.log(JSON.stringify(response, null, 2));
    
    // 详细检查 functionCalls
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('\n🔧 检测到函数调用:');
      response.functionCalls.forEach((fc, index) => {
        console.log(`\n  [函数调用 ${index + 1}]`);
        console.log('  - name:', fc.name);
        console.log('  - args:', JSON.stringify(fc.args, null, 2));
        console.log('  - thoughtSignature:', fc.thoughtSignature);
        console.log('  - thoughtSignature 类型:', typeof fc.thoughtSignature);
        console.log('  - thoughtSignature 是否存在:', fc.thoughtSignature !== undefined);
        console.log('  - thoughtSignature 是否为空:', !fc.thoughtSignature);
      });
    } else {
      console.log('\n⚠️  模型没有请求调用函数');
      console.log('📝 模型回复:', response.text);
    }
    
    // 检查原始响应中的 thoughtSignature
    console.log('\n🔍 检查原始响应中的 thoughtSignature:');
    const rawParts = response.rawResponse?.candidates?.[0]?.content?.parts || [];
    rawParts.forEach((part: any, index: number) => {
      console.log(`\n  [Part ${index}]`);
      console.log('  - type:', part.functionCall ? 'functionCall' : (part.text ? 'text' : 'unknown'));
      console.log('  - thoughtSignature:', part.thoughtSignature);
      console.log('  - 完整 part:', JSON.stringify(part, null, 2));
    });
    
  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testAPI2FunctionCall();

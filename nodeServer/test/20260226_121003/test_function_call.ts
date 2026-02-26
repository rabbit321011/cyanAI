import { callGoogleLLM, EasyGeminiRequest, Part } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testFunctionCall() {
  console.log('=== 测试 functionCall 功能 ===');
  
  // 构建测试请求
  const request: EasyGeminiRequest = {
    systemInstruction: '你是一个 helpful assistant，能够使用工具来完成任务。',
    contents: [
      {
        role: 'user',
        parts: [
          { text: '开始测试' }
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
            name: 'default_api:any-example',
            description: '这个工具会检测functionCall功能是否正常,其是通过测试functionCall的子功能test_function是否正常来运行的',
            parameters: {
              type: 'object',
              properties: {
                requirement_text: { type: 'string', description: '用自然语言描述你的需求,在这个工具里，你说：开始测试。就行' },
                wait_mode: { type: 'boolean', description: '如果该参数为true,那么就会阻断当前对话,等待执行完成再返回结果,如果为false,就不阻断当前对话,在执行结束后再弹出执行结果' }
              },
              required: ['requirement_text']
            }
          }
        ]
      }
    ]
  };

  console.log('📝 发送初始请求...');
  console.log('📋 Tools 配置:', request.tools);
  
  try {
    // 检查 library_source.ini 文件是否存在
    const iniPath = path.join(__dirname, '../../library_source.ini');
    console.log('📁 检查配置文件:', iniPath);
    console.log('📁 文件是否存在:', fs.existsSync(iniPath));
    
    // 发送初始请求
    const response = await callGoogleLLM(
      request,
      readIni(iniPath, 'google_api_key'),
      'gemini-3-pro-preview',
      readIni(iniPath, 'google_base_url')
    );
    
    console.log('✅ 初始请求成功');
    console.log('📝 响应:', JSON.stringify(response, null, 2));
    
    // 检查是否有函数调用
    if (response.functionCalls && response.functionCalls.length > 0) {
      console.log('🔧 模型请求调用函数:', response.functionCalls);
      
      // 构建包含函数调用和响应的请求
      const functionCall = response.functionCalls[0];
      
      // 从原始响应中提取thoughtSignature
      const thoughtSignature = response.rawResponse.candidates[0].content.parts[0].thoughtSignature;
      console.log('🔍 提取的thoughtSignature:', thoughtSignature);
      
      const retryRequest: EasyGeminiRequest = {
        systemInstruction: '你是一个 helpful assistant，能够使用工具来完成任务。',
        contents: [
          {
            role: 'user',
            parts: [
              { text: '开始测试' }
            ]
          },
          {
            role: 'function',
            parts: [
              {
                functionCall: {
                  name: functionCall.name,
                  args: functionCall.args
                },
                thoughtSignature: thoughtSignature
              }
            ]
          },
          {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    result: '测试结论：test_function运行正常。该函数按照预期功能工作，能够在输入的文本前添加"testSuccess:"前缀并返回结果。'
                  }
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000
        },
        tools: request.tools
      };
      
      console.log('\n📝 构建重试请求...');
      console.log('📋 重试请求内容:', JSON.stringify(retryRequest, null, 2));
      
      // 发送重试请求
      const retryResponse = await callGoogleLLM(
        retryRequest,
        readIni(iniPath, 'google_api_key'),
        'gemini-3-pro-preview',
        readIni(iniPath, 'google_base_url')
      );
      
      console.log('\n✅ 重试请求成功');
      console.log('📝 重试响应:', JSON.stringify(retryResponse, null, 2));
    } else {
      console.log('⚠️  模型没有请求调用函数');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testFunctionCall();

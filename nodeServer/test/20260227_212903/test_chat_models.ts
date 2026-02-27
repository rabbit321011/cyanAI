import { callGoogleLLM } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

// 常规的 chat 模型列表
const chatModels = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-001',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-2.0-flash-thinking-exp-01-21',
  'gemini-2.0-flash-thinking-exp-1219',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-06-17',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.5-flash-nothinking',
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.5-flash-preview-04-17-nothinking',
  'gemini-2.5-flash-preview-04-17-thinking',
  'gemini-2.5-flash-preview-05-20',
  'gemini-2.5-flash-preview-05-20-nothinking',
  'gemini-2.5-flash-preview-05-20-thinking',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-preview-09-2025-nothinking',
  'gemini-2.5-flash-preview-09-2025-thinking',
  'gemini-2.5-flash-thinking',
  'gemini-2.5-pro',
  'gemini-2.5-pro-exp-03-25',
  'gemini-2.5-pro-nothinking',
  'gemini-2.5-pro-preview-03-25',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.5-pro-preview-06-05',
  'gemini-2.5-pro-thinking',
  'gemini-3-flash-preview',
  'gemini-3-flash-preview-thinking-128',
  'gemini-3-pro-preview',
  'gemini-3.1-pro-preview'
];

// 测试单个模型
async function testModel(model: string, apiKey: string, baseUrl: string): Promise<{ model: string; accessible: boolean; error?: string }> {
  try {
    const request = {
      contents: [{
        role: 'user',
        parts: [{ text: 'Hello, test message' }]
      }],
      systemInstruction: 'You are a helpful assistant.',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100
      }
    };
    
    await callGoogleLLM(request, apiKey, model, baseUrl);
    return { model, accessible: true };
  } catch (error: any) {
    return { model, accessible: false, error: error.message };
  }
}

// 多线程测试所有模型
async function testAllModels() {
  try {
    const apiKey = readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key');
    const baseUrl = readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url');
    
    console.log('开始测试所有常规 chat 模型...');
    console.log(`共测试 ${chatModels.length} 个模型`);
    console.log('\n');
    
    // 分批测试，每批测试 5 个模型
    const batchSize = 5;
    const results: { model: string; accessible: boolean; error?: string }[] = [];
    
    for (let i = 0; i < chatModels.length; i += batchSize) {
      const batch = chatModels.slice(i, i + batchSize);
      console.log(`测试批次 ${Math.floor(i / batchSize) + 1}: ${batch.join(', ')}`);
      
      const batchResults = await Promise.all(
        batch.map(model => testModel(model, apiKey, baseUrl))
      );
      
      results.push(...batchResults);
      
      // 输出当前批次的测试结果
      batchResults.forEach(result => {
        if (result.accessible) {
          console.log(`✅ ${result.model}: 可访问`);
        } else {
          console.log(`❌ ${result.model}: 不可访问 - ${result.error}`);
        }
      });
      
      console.log('\n');
    }
    
    // 整理最终结果
    const accessibleModels = results.filter(result => result.accessible).map(result => result.model);
    const inaccessibleModels = results.filter(result => !result.accessible).map(result => result.model);
    
    console.log('====================================');
    console.log('测试结果总结:');
    console.log('====================================');
    console.log(`可访问的模型 (${accessibleModels.length} 个):`);
    accessibleModels.forEach(model => console.log(`- ${model}`));
    console.log('\n');
    console.log(`不可访问的模型 (${inaccessibleModels.length} 个):`);
    inaccessibleModels.forEach(model => console.log(`- ${model}`));
    
  } catch (error: any) {
    console.error('测试过程中出错:', error.message);
  }
}

testAllModels();
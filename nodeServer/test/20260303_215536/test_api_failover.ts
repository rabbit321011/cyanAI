import { callGoogleLLM } from '../../src/utility/LLM_call/google_call';
import { getApiKeyManager, resetApiKeyManager } from '../../src/utility/error_type/api_key_manager';
import { getErrorClassifier, resetErrorClassifier } from '../../src/utility/error_type/error_classifier';

async function testApiFailover() {
    console.log('=== 测试 API 故障转移机制 ===\n');
    
    // 重置单例，确保加载最新配置
    resetApiKeyManager();
    resetErrorClassifier();
    
    const keyManager = getApiKeyManager();
    
    // 1. 测试 API Key 管理器
    console.log('1. 测试 API Key 管理器');
    console.log('所有可用的 API keys:');
    const allKeys = keyManager.getAllKeys();
    allKeys.forEach(key => {
        console.log(`  - 优先级 ${key.priority}: ${key.baseUrl}`);
    });
    
    const currentKey = keyManager.getCurrentKey();
    console.log(`当前使用的 key: 优先级 ${currentKey?.priority}`);
    console.log();
    
    // 2. 测试正常调用
    console.log('2. 测试正常 API 调用');
    try {
        const response = await callGoogleLLM({
            contents: [{
                role: 'user',
                parts: [{ text: 'Hello, this is a test message.' }]
            }]
        }, undefined, 'gemini-2.5-flash');
        
        console.log('✅ 正常调用成功');
        console.log('响应:', response.text.substring(0, 100) + '...');
    } catch (error: any) {
        console.error('❌ 正常调用失败:', error.message);
    }
    console.log();
    
    // 3. 测试错误分类器
    console.log('3. 测试错误分类器');
    const classifier = getErrorClassifier();
    
    // 模拟各种错误
    const testErrors = [
        {
            name: 'Rate limit (429)',
            error: {
                response: { status: 429, data: { error: { code: 'rate_limit' } } }
            }
        },
        {
            name: 'Model not found (404)',
            error: {
                response: { 
                    status: 404, 
                    data: { 
                        error: { 
                            code: 'model_not_found',
                            message: 'No available channel for model'
                        } 
                    } 
                }
            }
        },
        {
            name: 'Invalid API key (401)',
            error: {
                response: { status: 401, data: { error: { code: 'invalid_api_key' } } }
            }
        },
        {
            name: 'Network timeout',
            error: {
                code: 'ETIMEDOUT',
                message: 'Connection timed out'
            }
        }
    ];
    
    for (const test of testErrors) {
        const result = classifier.classifyError(test.error);
        console.log(`  ${test.name}: action=${result.action}, shouldRetry=${result.shouldRetry}`);
    }
    console.log();
    
    // 4. 测试 API 切换
    console.log('4. 测试 API 切换');
    const keyBefore = keyManager.getCurrentKey();
    console.log(`切换前: 优先级 ${keyBefore?.priority}`);
    
    keyManager.switchToNextKey();
    
    const keyAfter = keyManager.getCurrentKey();
    console.log(`切换后: 优先级 ${keyAfter?.priority}`);
    console.log();
    
    // 5. 测试使用切换后的 key 调用
    console.log('5. 测试使用切换后的 key 调用');
    try {
        const response = await callGoogleLLM({
            contents: [{
                role: 'user',
                parts: [{ text: 'Hello from switched API!' }]
            }]
        }, undefined, 'gemini-2.5-flash');
        
        console.log('✅ 切换后调用成功');
        console.log('响应:', response.text.substring(0, 100) + '...');
    } catch (error: any) {
        console.error('❌ 切换后调用失败:', error.message);
    }
    
    console.log('\n=== 测试完成 ===');
}

testApiFailover().catch(console.error);

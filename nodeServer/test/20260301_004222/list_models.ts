import { getAvailableModels } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function listAllModels() {
    const apiKey = readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key');
    const baseUrl = readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url');
    
    const models = await getAvailableModels(apiKey, baseUrl);
    
    console.log('========== 所有可用模型 ==========\n');
    
    const gemini3Models = models.filter(m => m.includes('3') || m.includes('gemini-3'));
    const gemini25Models = models.filter(m => m.includes('2.5') || m.includes('2-5'));
    const gemini2Models = models.filter(m => m.includes('2.0') || m.includes('2-0') || m.includes('gemini-2'));
    const gemini15Models = models.filter(m => m.includes('1.5') || m.includes('1-5'));
    
    console.log('--- Gemini 3.x ---');
    gemini3Models.forEach(m => console.log('  ' + m));
    
    console.log('\n--- Gemini 2.5 ---');
    gemini25Models.forEach(m => console.log('  ' + m));
    
    console.log('\n--- Gemini 2.0 ---');
    gemini2Models.filter(m => !m.includes('2.5')).forEach(m => console.log('  ' + m));
    
    console.log('\n--- Gemini 1.5 ---');
    gemini15Models.forEach(m => console.log('  ' + m));
    
    console.log('\n--- 其他 ---');
    models.filter(m => 
        !m.includes('gemini-3') && 
        !m.includes('2.5') && 
        !m.includes('2-5') && 
        !m.includes('2.0') && 
        !m.includes('2-0') && 
        !m.includes('1.5') && 
        !m.includes('1-5')
    ).forEach(m => console.log('  ' + m));
    
    console.log('\n总计:', models.length, '个模型');
}

listAllModels().catch(console.error);

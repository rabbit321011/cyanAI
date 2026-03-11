// 测试余额检测 API
import { getTokenUsage } from '../../src/utility/LLM_call/google_call';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function testTokenUsage() {
    console.log("=== 测试余额检测 API ===\n");
    
    const iniPath = path.join(__dirname, '../../library_source.ini');
    console.log("INI 文件路径:", iniPath);
    
    const apiKey = readIni(iniPath, 'google_api_key');
    const baseUrl = readIni(iniPath, 'google_base_url');
    
    console.log("API Key:", apiKey.substring(0, 20) + "...");
    console.log("Base URL:", baseUrl);
    
    console.log("\n查询余额...");
    try {
        const response = await getTokenUsage(apiKey, baseUrl);
        console.log("成功！");
        console.log("响应:", JSON.stringify(response, null, 2));
    } catch (error: any) {
        console.error("失败:", error.message);
    }
}

testTokenUsage();

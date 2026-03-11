import { getTokenUsage } from '../../src/utility/LLM_call/google_call';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ApiConfig {
  key: string;
  baseUrl: string;
  value: number;
}

function parseLibrarySource(): ApiConfig[] {
  const configPath = join(__dirname, '..', '..', 'library_source.ini');
  const content = readFileSync(configPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const apis: ApiConfig[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('google_api_key_')) {
      const match = trimmed.match(/google_api_key_(\d+)=(.+)/);
      if (match) {
        const index = match[1];
        const key = match[2];
        
        const baseUrlLine = lines.find(l => l.trim().startsWith(`google_base_url_${index}=`));
        const valueLine = lines.find(l => l.trim().startsWith(`google_api_value_${index}=`));
        
        if (baseUrlLine && valueLine) {
          const baseUrl = baseUrlLine.split('=')[1].trim();
          const value = parseInt(valueLine.split('=')[1].trim(), 10);
          apis.push({ key, baseUrl, value });
        }
      }
    }
  }
  
  return apis;
}

async function main() {
  console.log('=== 使用 getTokenUsage 查询所有 API 余额（含等效余额）===\n');
  
  const apis = parseLibrarySource();
  
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    console.log(`\n📊 API ${i + 1}:`);
    console.log(`   Key: ${api.key.substring(0, 15)}...`);
    console.log(`   URL: ${api.baseUrl}`);
    console.log(`   配置额度: ${api.value} 元`);
    
    try {
      // 传入 keyValue 参数以计算等效余额
      const response = await getTokenUsage(api.key, api.baseUrl, api.value);
      
      const usage = response.data;
      
      if (usage) {
        console.log(`   ✅ 查询成功:`);
        console.log(`      - 名称: ${usage.name || 'N/A'}`);
        console.log(`      - 总额度: ${usage.total_granted?.toLocaleString() || 'N/A'}`);
        console.log(`      - 已使用: ${usage.total_used?.toLocaleString() || 'N/A'}`);
        console.log(`      - 剩余: ${usage.total_available?.toLocaleString() || 'N/A'}`);
        console.log(`      - 无限额度: ${usage.unlimited_quota ? '是' : '否'}`);
        console.log(`      - 💰 等效余额: ${usage.equivalent_balance !== undefined ? usage.equivalent_balance + ' 元' : 'N/A'}`);
      } else {
        console.log(`   ⚠️ 返回数据为空`);
        console.log(`   原始响应:`, JSON.stringify(response, null, 2).substring(0, 200));
      }
    } catch (error: any) {
      console.log(`   ❌ 查询失败: ${error.message}`);
    }
  }
  
  console.log('\n=== 查询完成 ===');
}

main().catch(console.error);

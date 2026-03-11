import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TokenUsageResponse {
  total_granted: number;
  total_used: number;
  total_available: number;
  unlimited_quota: boolean;
}

async function getTokenUsage(apiKey: string, baseUrl: string): Promise<TokenUsageResponse | null> {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const url = `${cleanBaseUrl}/api/usage/token`;

  try {
    const response = await axios.get(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000
    });
    // 有些 API 返回的数据在 data 字段中
    const data = response.data?.data || response.data;
    return data;
  } catch (error: any) {
    const errorDetails = error?.response?.data || error.message;
    console.error(`  ❌ 查询失败: ${error.message}`);
    return null;
  }
}

function parseLibrarySource(): Array<{ key: string; baseUrl: string; value: number }> {
  const configPath = join(__dirname, '..', '..', 'library_source.ini');
  const content = readFileSync(configPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const apis: Array<{ key: string; baseUrl: string; value: number }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('google_api_key_')) {
      const match = trimmed.match(/google_api_key_(\d+)=(.+)/);
      if (match) {
        const index = match[1];
        const key = match[2];
        
        // 查找对应的 baseUrl 和 value
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
  console.log('=== 查询所有 API 余额 ===\n');
  
  const apis = parseLibrarySource();
  
  for (let i = 0; i < apis.length; i++) {
    const api = apis[i];
    console.log(`\n📊 API ${i + 1}:`);
    console.log(`   Key: ${api.key.substring(0, 15)}...`);
    console.log(`   URL: ${api.baseUrl}`);
    console.log(`   配置额度: ${api.value} 元`);
    
    const usage = await getTokenUsage(api.key, api.baseUrl);
    
    if (usage) {
      console.log(`   ✅ 查询成功:`);
      console.log(`      - 原始数据:`, JSON.stringify(usage, null, 2).substring(0, 200));
      if (usage.total_granted !== undefined) {
        console.log(`      - 总额度: ${usage.total_granted.toFixed(2)}`);
      }
      if (usage.total_used !== undefined) {
        console.log(`      - 已使用: ${usage.total_used.toFixed(2)}`);
      }
      if (usage.total_available !== undefined) {
        console.log(`      - 剩余: ${usage.total_available.toFixed(2)}`);
      }
      if (usage.unlimited_quota !== undefined) {
        console.log(`      - 无限额度: ${usage.unlimited_quota ? '是' : '否'}`);
      }
    } else {
      console.log(`   ⚠️ 无法查询余额`);
    }
  }
}

main().catch(console.error);

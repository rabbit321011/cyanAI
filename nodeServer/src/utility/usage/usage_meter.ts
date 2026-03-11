import * as path from 'path';
import { readIni } from '../file_operation/read_ini';
import { getTokenUsage, TokenUsageResponse } from '../LLM_call/google_call';

const INI_FILE_PATH = path.join(__dirname, '../../../library_source.ini');
const TOTAL_BALANCE_CNY = 80; // 当前 key 的总 token 等效余额是 80 元人民币

interface ApiKeyConfig {
    key: string;
    baseUrl: string;
    priority: number;
    value: number; // 该 API Key 的总价值（人民币）
}

interface UsageInfo {
    totalGranted: number;
    totalUsed: number;
    totalAvailable: number;
    unlimitedQuota: boolean;
    expiresAt: number;
}

function getAllApiKeys(): ApiKeyConfig[] {
    const keyCount = parseInt(readIni(INI_FILE_PATH, 'google_api_num') || '1');
    const keys: ApiKeyConfig[] = [];
    
    for (let i = 1; i <= keyCount; i++) {
        const key = readIni(INI_FILE_PATH, `google_api_key_${i}`);
        const baseUrl = readIni(INI_FILE_PATH, `google_base_url_${i}`);
        const valueStr = readIni(INI_FILE_PATH, `google_api_value_${i}`);
        const value = parseFloat(valueStr) || 80; // 默认 80 元
        
        if (key && baseUrl) {
            keys.push({
                key,
                baseUrl,
                priority: i,
                value
            });
        }
    }
    
    return keys;
}

async function getSingleKeyBalance(apiKey: string, baseUrl: string, priority: number, keyValue: number): Promise<{
    success: boolean;
    equivalentBalance: number;
    totalGranted: number;
    totalAvailable: number;
    error?: string;
}> {
    try {
        const response = await getTokenUsage(apiKey, baseUrl);
        
        if (response.code && response.data) {
            const data = response.data;
            // 等效余额 = (剩余 token / 总授予 token) * 该 Key 的总价值
            const equivalentBalance = (data.total_available / data.total_granted) * keyValue;
            return {
                success: true,
                equivalentBalance: parseFloat(equivalentBalance.toFixed(4)),
                totalGranted: data.total_granted,
                totalAvailable: data.total_available
            };
        }
        
        return {
            success: false,
            equivalentBalance: 0,
            totalGranted: 0,
            totalAvailable: 0,
            error: response.message || '获取余额失败'
        };
    } catch (error: any) {
        return {
            success: false,
            equivalentBalance: 0,
            totalGranted: 0,
            totalAvailable: 0,
            error: error.message
        };
    }
}

export async function getEquivalentBalance(): Promise<number> {
    const keys = getAllApiKeys();
    
    if (keys.length === 0) {
        throw new Error('没有配置任何 API key');
    }
    
    console.log(`[余额查询] 开始查询 ${keys.length} 个 API Key 的余额...`);
    
    let totalBalance = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (const keyConfig of keys) {
        const result = await getSingleKeyBalance(keyConfig.key, keyConfig.baseUrl, keyConfig.priority, keyConfig.value);
        
        if (result.success) {
            console.log(`[余额查询] Key ${keyConfig.priority} (价值￥${keyConfig.value}): ￥${result.equivalentBalance} (可用: ${result.totalAvailable}, 授予: ${result.totalGranted})`);
            totalBalance += result.equivalentBalance;
            successCount++;
        } else {
            console.error(`[余额查询] Key ${keyConfig.priority} (价值￥${keyConfig.value}): 查询失败 - ${result.error}`);
            failCount++;
        }
    }
    
    console.log(`[余额查询] 总计: ￥${totalBalance.toFixed(4)} (成功: ${successCount}, 失败: ${failCount})`);
    
    return parseFloat(totalBalance.toFixed(4));
}

export async function getRemainingTokens(): Promise<number> {
    const keys = getAllApiKeys();
    
    if (keys.length === 0) {
        throw new Error('没有配置任何 API key');
    }
    
    let totalTokens = 0;
    
    for (const keyConfig of keys) {
        try {
            const response = await getTokenUsage(keyConfig.key, keyConfig.baseUrl);
            if (response.code && response.data) {
                totalTokens += response.data.total_available;
            }
        } catch (error: any) {
            console.error(`[余额查询] Key ${keyConfig.priority} 获取剩余 token 失败:`, error.message);
        }
    }
    
    return totalTokens;
}

export async function getUsageInfo(): Promise<{
    totalGranted: number;
    totalUsed: number;
    remainingTokens: number;
    equivalentBalance: number;
    unlimitedQuota: boolean;
    expiresAt: number;
}> {
    const keys = getAllApiKeys();
    
    if (keys.length === 0) {
        throw new Error('没有配置任何 API key');
    }
    
    let totalGranted = 0;
    let totalUsed = 0;
    let totalAvailable = 0;
    let unlimitedQuota = false;
    let expiresAt = 0;
    
    for (const keyConfig of keys) {
        try {
            const response = await getTokenUsage(keyConfig.key, keyConfig.baseUrl);
            if (response.code && response.data) {
                const data = response.data;
                totalGranted += data.total_granted;
                totalUsed += data.total_used;
                totalAvailable += data.total_available;
                if (data.unlimited_quota) unlimitedQuota = true;
                if (data.expires_at > expiresAt) expiresAt = data.expires_at;
            }
        } catch (error: any) {
            console.error(`[余额查询] Key ${keyConfig.priority} 获取使用信息失败:`, error.message);
        }
    }
    
    const equivalentBalance = (totalAvailable / totalGranted) * TOTAL_BALANCE_CNY;
    
    return {
        totalGranted,
        totalUsed,
        remainingTokens: totalAvailable,
        equivalentBalance: parseFloat(equivalentBalance.toFixed(4)),
        unlimitedQuota,
        expiresAt
    };
}

export async function getRawTokenUsage(): Promise<TokenUsageResponse> {
    const keys = getAllApiKeys();
    
    if (keys.length === 0) {
        throw new Error('没有配置任何 API key');
    }
    
    // 默认返回第一个 key 的原始数据
    return getTokenUsage(keys[0].key, keys[0].baseUrl);
}

export async function getAllKeysBalance(): Promise<Array<{
    priority: number;
    keyValue: number;
    success: boolean;
    equivalentBalance: number;
    totalGranted: number;
    totalAvailable: number;
    error?: string;
}>> {
    const keys = getAllApiKeys();
    const results = [];
    
    for (const keyConfig of keys) {
        const result = await getSingleKeyBalance(keyConfig.key, keyConfig.baseUrl, keyConfig.priority, keyConfig.value);
        results.push({
            priority: keyConfig.priority,
            keyValue: keyConfig.value,
            ...result
        });
    }
    
    return results;
}

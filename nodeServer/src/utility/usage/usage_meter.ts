import * as path from 'path';
import { readIni } from '../file_operation/read_ini';
import { getTokenUsage, TokenUsageResponse } from '../LLM_call/google_call';

const INI_FILE_PATH = path.join(__dirname, '../../../library_source.ini');
const TOTAL_BALANCE_CNY = 80; // 当前 key 的总 token 等效余额是 80 元人民币

interface UsageInfo {
    totalGranted: number;
    totalUsed: number;
    totalAvailable: number;
    unlimitedQuota: boolean;
    expiresAt: number;
}

function getApiKey(): string {
    return readIni(INI_FILE_PATH, 'google_api_key');
}

function getBaseUrl(): string {
    return readIni(INI_FILE_PATH, 'google_base_url');
}

export async function getRemainingTokens(): Promise<number> {
    try {
        const apiKey = getApiKey();
        const baseUrl = getBaseUrl();
        
        if (!apiKey || !baseUrl) {
            throw new Error('API key 或 base URL 未配置');
        }
        
        const response = await getTokenUsage(apiKey, baseUrl);
        
        if (response.code && response.data) {
            return response.data.total_available;
        }
        
        throw new Error(response.message || '获取 token 使用情况失败');
    } catch (error: any) {
        console.error('获取剩余 token 失败:', error.message);
        throw error;
    }
}

export async function getEquivalentBalance(): Promise<number> {
    try {
        const apiKey = getApiKey();
        const baseUrl = getBaseUrl();
        
        if (!apiKey || !baseUrl) {
            throw new Error('API key 或 base URL 未配置');
        }
        
        const response = await getTokenUsage(apiKey, baseUrl);
        
        if (response.code && response.data) {
            const data = response.data;
            // 等效余额 = (剩余 token / 总授予 token) * 总余额(80元)
            const equivalentBalance = (data.total_available / data.total_granted) * TOTAL_BALANCE_CNY;
            return parseFloat(equivalentBalance.toFixed(4));
        }
        
        throw new Error(response.message || '获取等效余额失败');
    } catch (error: any) {
        console.error('获取等效余额失败:', error.message);
        throw error;
    }
}

export async function getUsageInfo(): Promise<{
    totalGranted: number;
    totalUsed: number;
    remainingTokens: number;
    equivalentBalance: number;
    unlimitedQuota: boolean;
    expiresAt: number;
}> {
    try {
        const apiKey = getApiKey();
        const baseUrl = getBaseUrl();
        
        if (!apiKey || !baseUrl) {
            throw new Error('API key 或 base URL 未配置');
        }
        
        const response = await getTokenUsage(apiKey, baseUrl);
        
        if (response.code && response.data) {
            const data = response.data;
            // 等效余额 = (剩余 token / 总授予 token) * 总余额(80元)
            const equivalentBalance = (data.total_available / data.total_granted) * TOTAL_BALANCE_CNY;
            return {
                totalGranted: data.total_granted,
                totalUsed: data.total_used,
                remainingTokens: data.total_available,
                equivalentBalance: parseFloat(equivalentBalance.toFixed(4)),
                unlimitedQuota: data.unlimited_quota,
                expiresAt: data.expires_at
            };
        }
        
        throw new Error(response.message || '获取使用信息失败');
    } catch (error: any) {
        console.error('获取使用信息失败:', error.message);
        throw error;
    }
}

export async function getRawTokenUsage(): Promise<TokenUsageResponse> {
    const apiKey = getApiKey();
    const baseUrl = getBaseUrl();
    
    if (!apiKey || !baseUrl) {
        throw new Error('API key 或 base URL 未配置');
    }
    
    return getTokenUsage(apiKey, baseUrl);
}

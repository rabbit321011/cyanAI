import path from 'path';
import fs from 'fs';

export type ErrorAction = 'switch_api' | 'retry' | 'throw';

export interface ClassifiedError {
    action: ErrorAction;
    message: string;
    shouldRetry: boolean;
}

class ErrorClassifier {
    private needSwitchCodes: string[] = [];
    private needSwitchMessages: string[] = [];
    private retryableCodes: string[] = [];
    private errorCodeMap: Map<string, string> = new Map();
    private errorMessageMap: Map<string, string> = new Map();

    constructor() {
        this.loadConfig();
    }

    private loadConfig(): void {
        const configPath = path.join(__dirname, 'error_type.ini');
        
        try {
            // 加载需要切换 API 的错误码
            const needSwitchSection = this.parseSection(configPath, 'need_switch_api');
            this.needSwitchCodes = Object.keys(needSwitchSection).filter(k => needSwitchSection[k] === 'true');
            
            // 加载可重试的错误码
            const retryableSection = this.parseSection(configPath, 'retryable');
            this.retryableCodes = Object.keys(retryableSection).filter(k => retryableSection[k] === 'true');
            
            // 加载 HTTP 状态码映射
            const codeSection = this.parseSection(configPath, 'error_codes');
            for (const [code, type] of Object.entries(codeSection)) {
                this.errorCodeMap.set(code, type);
            }
            
            // 加载错误消息关键词映射
            const messageSection = this.parseSection(configPath, 'error_messages');
            for (const [type, keyword] of Object.entries(messageSection)) {
                this.errorMessageMap.set(type, keyword.toLowerCase());
            }
            
            console.log('[ErrorClassifier] 配置加载完成');
        } catch (error) {
            console.error('[ErrorClassifier] 加载配置失败:', error);
            // 使用默认配置
            this.useDefaultConfig();
        }
    }

    private parseSection(filePath: string, sectionName: string): Record<string, string> {
        const result: Record<string, string> = {};
        
        try {
            if (!fs.existsSync(filePath)) {
                console.error(`[ErrorClassifier] 配置文件不存在: ${filePath}`);
                return result;
            }
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split(/\r?\n/);
            
            let inTargetSection = false;
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                // 跳过空行和注释
                if (!trimmed || trimmed.startsWith(';')) continue;
                
                // 检查 section 开始
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const currentSection = trimmed.slice(1, -1);
                    inTargetSection = (currentSection === sectionName);
                    continue;
                }
                
                // 如果在目标 section 中，解析键值对
                if (inTargetSection) {
                    const eqIndex = trimmed.indexOf('=');
                    if (eqIndex > 0) {
                        const key = trimmed.substring(0, eqIndex).trim();
                        const value = trimmed.substring(eqIndex + 1).trim();
                        result[key] = value;
                    }
                }
            }
        } catch (error) {
            console.error(`[ErrorClassifier] 解析 section ${sectionName} 失败:`, error);
        }
        
        return result;
    }

    private useDefaultConfig(): void {
        this.needSwitchCodes = ['model_not_found', 'rate_limit', 'invalid_api_key', 'channel_unavailable'];
        this.retryableCodes = ['timeout', 'network_error', 'server_error'];
        this.errorCodeMap.set('429', 'rate_limit');
        this.errorCodeMap.set('401', 'invalid_api_key');
        this.errorCodeMap.set('404', 'model_not_found');
        this.errorCodeMap.set('503', 'channel_unavailable');
        this.errorCodeMap.set('504', 'timeout');
    }

    classifyError(error: any): ClassifiedError {
        const statusCode = error?.response?.status?.toString();
        const errorData = error?.response?.data;
        const errorMessage = (error?.message || '').toLowerCase();
        const errorType = errorData?.error?.type?.toLowerCase() || '';
        const errorCode = errorData?.error?.code?.toLowerCase() || '';
        const errorMsg = (errorData?.error?.message || '').toLowerCase();

        // 1. 检查 HTTP 状态码
        if (statusCode) {
            const mappedType = this.errorCodeMap.get(statusCode);
            if (mappedType) {
                if (this.needSwitchCodes.includes(mappedType)) {
                    return {
                        action: 'switch_api',
                        message: `HTTP ${statusCode}: ${mappedType}`,
                        shouldRetry: false
                    };
                }
                if (this.retryableCodes.includes(mappedType)) {
                    return {
                        action: 'retry',
                        message: `HTTP ${statusCode}: ${mappedType}`,
                        shouldRetry: true
                    };
                }
            }
        }

        // 2. 检查错误类型
        if (errorType && this.needSwitchCodes.includes(errorType)) {
            return {
                action: 'switch_api',
                message: `Error type: ${errorType}`,
                shouldRetry: false
            };
        }

        // 3. 检查错误码
        if (errorCode && this.needSwitchCodes.includes(errorCode)) {
            return {
                action: 'switch_api',
                message: `Error code: ${errorCode}`,
                shouldRetry: false
            };
        }

        // 4. 检查错误消息关键词
        for (const [type, keyword] of this.errorMessageMap.entries()) {
            if (errorMsg.includes(keyword) || errorMessage.includes(keyword)) {
                if (this.needSwitchCodes.includes(type)) {
                    return {
                        action: 'switch_api',
                        message: `Error message contains: ${keyword}`,
                        shouldRetry: false
                    };
                }
            }
        }

        // 5. 检查 axios 超时错误（如 "timeout of 300000ms exceeded"）
        if (errorMessage.includes('timeout of') && errorMessage.includes('ms exceeded')) {
            return {
                action: 'switch_api',
                message: `HTTP timeout: ${errorMessage}`,
                shouldRetry: false
            };
        }

        // 6. 连接超时也切换 API
        if (error?.code === 'ETIMEDOUT') {
            return {
                action: 'switch_api',
                message: `Connection timeout: ${error.code}`,
                shouldRetry: false
            };
        }

        // 7. 可重试的网络错误
        const retryableNetworkErrors = ['ECONNREFUSED', 'ENOTFOUND'];
        if (retryableNetworkErrors.includes(error?.code) || errorMessage.includes('socket hang up')) {
            return {
                action: 'retry',
                message: error?.code ? `Network error: ${error.code}` : 'Socket hang up',
                shouldRetry: true
            };
        }

        // 8. 未知错误，直接抛出
        return {
            action: 'throw',
            message: errorMessage || 'Unknown error',
            shouldRetry: false
        };
    }
}

// 单例实例
let errorClassifierInstance: ErrorClassifier | null = null;

export function getErrorClassifier(): ErrorClassifier {
    if (!errorClassifierInstance) {
        errorClassifierInstance = new ErrorClassifier();
    }
    return errorClassifierInstance;
}

export function resetErrorClassifier(): void {
    errorClassifierInstance = null;
}

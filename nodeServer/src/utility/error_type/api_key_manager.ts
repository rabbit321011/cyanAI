import { readIni } from '../file_operation/read_ini';
import { writeIni } from '../file_operation/write_ini';
import { now, add, sub, compare } from '../time/cyan_time';
import path from 'path';
import fs from 'fs';

interface ApiKeyConfig {
    key: string;
    baseUrl: string;
    priority: number; // 数字越小优先级越高
}

interface ApiKeyManagerState {
    currentPriority: number;
    lastSwitchTime: string; // cyan_time 格式的时间戳
    failedPriorities: number[];
}

class ApiKeyManager {
    private keys: ApiKeyConfig[] = [];
    private state: ApiKeyManagerState = {
        currentPriority: 1,
        lastSwitchTime: '00000101_000000',
        failedPriorities: []
    };
    private readonly stateFilePath: string;

    constructor() {
        this.stateFilePath = path.join(__dirname, '../../../core_datas/main_virtual/api_key_state.ini');
        this.loadKeys();
        this.loadState();
    }

    private loadKeys(): void {
        const iniPath = path.join(__dirname, '../../../library_source.ini');
        const keyCount = parseInt(readIni(iniPath, 'google_api_num') || '1');
        
        this.keys = [];
        for (let i = 1; i <= keyCount; i++) {
            const key = readIni(iniPath, `google_api_key_${i}`);
            const baseUrl = readIni(iniPath, `google_base_url_${i}`);
            
            if (key && baseUrl) {
                this.keys.push({
                    key,
                    baseUrl,
                    priority: i // 数字越小优先级越高
                });
            }
        }
        
        // 按优先级排序
        this.keys.sort((a, b) => a.priority - b.priority);
        console.log(`[ApiKeyManager] 加载了 ${this.keys.length} 个 API key`);
    }

    private loadState(): void {
        try {
            if (fs.existsSync(this.stateFilePath)) {
                const currentPriorityStr = readIni(this.stateFilePath, 'currentPriority');
                const lastSwitchTime = readIni(this.stateFilePath, 'lastSwitchTime');
                const failedPrioritiesStr = readIni(this.stateFilePath, 'failedPriorities');
                
                this.state = {
                    currentPriority: parseInt(currentPriorityStr) || 1,
                    lastSwitchTime: lastSwitchTime || '00000101_000000',
                    failedPriorities: failedPrioritiesStr ? failedPrioritiesStr.split(',').map(Number) : []
                };
                
                // 兼容旧的状态文件格式（lastSwitchTime 可能是数字）
                if (lastSwitchTime && !isNaN(Number(lastSwitchTime)) && !lastSwitchTime.includes('_')) {
                    const timestamp = Number(lastSwitchTime);
                    const EPOCH_MS = (function initEpoch() {
                        const d = new Date(0, 0, 1, 0, 0, 0);
                        d.setFullYear(0); 
                        return d.getTime();
                    })();
                    const relativeMs = timestamp - EPOCH_MS;
                    const d = new Date(EPOCH_MS + relativeMs);
                    const Y = d.getFullYear().toString().padStart(4, '0');
                    const M = (d.getMonth() + 1).toString().padStart(2, '0');
                    const D = d.getDate().toString().padStart(2, '0');
                    const H = d.getHours().toString().padStart(2, '0');
                    const m = d.getMinutes().toString().padStart(2, '0');
                    const s = d.getSeconds().toString().padStart(2, '0');
                    
                    this.state.lastSwitchTime = `${Y}${M}${D}_${H}${m}${s}`;
                    console.log(`[ApiKeyManager] 转换旧时间戳格式: ${this.state.lastSwitchTime}`);
                }
                
                console.log(`[ApiKeyManager] 加载状态: 当前优先级=${this.state.currentPriority}`);
            } else {
                this.resetState();
            }
        } catch (error) {
            console.error('[ApiKeyManager] 加载状态失败:', error);
            this.resetState();
        }
    }

    private saveState(): void {
        try {
            const dir = path.dirname(this.stateFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            writeIni(this.stateFilePath, 'currentPriority', this.state.currentPriority.toString());
            writeIni(this.stateFilePath, 'lastSwitchTime', this.state.lastSwitchTime);
            writeIni(this.stateFilePath, 'failedPriorities', this.state.failedPriorities.join(','));
        } catch (error) {
            console.error('[ApiKeyManager] 保存状态失败:', error);
        }
    }

    private resetState(): void {
        this.state = {
            currentPriority: this.keys.length > 0 ? this.keys[0].priority : 1,
            lastSwitchTime: '00000101_000000',
            failedPriorities: []
        };
        this.saveState();
    }

    getCurrentKey(): ApiKeyConfig | null {
        this.tryRecoverPriority();
        
        const key = this.keys.find(k => k.priority === this.state.currentPriority);
        if (key) {
            return key;
        }
        
        // 如果当前优先级找不到，使用第一个可用的
        if (this.keys.length > 0) {
            this.state.currentPriority = this.keys[0].priority;
            this.saveState();
            return this.keys[0];
        }
        
        return null;
    }

    switchToNextKey(): ApiKeyConfig | null {
        const currentIndex = this.keys.findIndex(k => k.priority === this.state.currentPriority);
        
        // 记录失败的优先级
        if (!this.state.failedPriorities.includes(this.state.currentPriority)) {
            this.state.failedPriorities.push(this.state.currentPriority);
        }
        
        // 找到下一个可用的 key
        for (let i = currentIndex + 1; i < this.keys.length; i++) {
            const nextKey = this.keys[i];
            if (!this.state.failedPriorities.includes(nextKey.priority)) {
                this.state.currentPriority = nextKey.priority;
                this.state.lastSwitchTime = now();
                this.saveState();
                console.log(`[ApiKeyManager] 切换到 API key ${nextKey.priority}`);
                return nextKey;
            }
        }
        
        // 所有 key 都失败了
        console.error('[ApiKeyManager] 所有 API key 都不可用');
        return null;
    }

    private tryRecoverPriority(): void {
        // 检查是否可以切回更高优先级的 key
        if (this.state.lastSwitchTime === '00000101_000000') return;
        
        const currentTime = now();
        // 直接使用 cyan_time 的比较函数
        const timeDiff = sub(currentTime, this.state.lastSwitchTime);
        
        // 检查是否已经过了 15 分钟
        const cooldownTime = '15min';
        // 使用 cyan_time 的 compare 函数
        const comparison = compare(timeDiff, cooldownTime);
        if (comparison < 0) return;
        
        // 15分钟过去了，尝试切回最高优先级的 key
        const highestPriority = this.keys[0]?.priority;
        if (highestPriority && this.state.currentPriority !== highestPriority) {
            console.log(`[ApiKeyManager] 15分钟冷却结束，尝试切回优先级 ${highestPriority}`);
            this.state.currentPriority = highestPriority;
            this.state.failedPriorities = []; // 清空失败记录
            this.state.lastSwitchTime = '00000101_000000'; // 重置为初始值
            this.saveState();
        }
    }

    resetFailedPriorities(): void {
        this.state.failedPriorities = [];
        this.saveState();
    }

    resetToFirstKey(): void {
        if (this.keys.length > 0) {
            this.state.currentPriority = this.keys[0].priority;
            this.state.failedPriorities = [];
            this.state.lastSwitchTime = '00000101_000000';
            this.saveState();
            console.log(`[ApiKeyManager] 已重置到第一个 API key (优先级 ${this.keys[0].priority})`);
        }
    }

    getAllKeys(): ApiKeyConfig[] {
        return [...this.keys];
    }
}

// 单例实例
let apiKeyManagerInstance: ApiKeyManager | null = null;

export function getApiKeyManager(): ApiKeyManager {
    if (!apiKeyManagerInstance) {
        apiKeyManagerInstance = new ApiKeyManager();
    }
    return apiKeyManagerInstance;
}

export function resetApiKeyManager(): void {
    apiKeyManagerInstance = null;
}

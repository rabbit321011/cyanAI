/**
 * KEY管理系统 - 负责KEY的创建、查询、验证、绑定等操作
 *
 * 数据存储结构：
 * - dataBase/user_keys/keys.json - 所有KEY记录
 * - dataBase/user_keys/bindings.json - QQ到KEY的绑定关系
 * - dataBase/user_keys/blacklist.json - 黑名单
 * - dataBase/user_keys/admin_key.json - 管理员KEY配置
 */

import fs from 'fs';
import path from 'path';
import { KeyRecord, KeyPermission, QuotaValue, QqKeyBinding, BlacklistRecord } from './key_types';

// 数据目录
const DATA_DIR = path.join(__dirname, '../../../dataBase/user_keys');

// 配置文件路径
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');
const BINDINGS_FILE = path.join(DATA_DIR, 'bindings.json');
const BLACKLIST_FILE = path.join(DATA_DIR, 'blacklist.json');
const ADMIN_KEY_FILE = path.join(DATA_DIR, 'admin_key.json');

// 初始化数据目录和文件
function initDataFiles(): void {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // 初始化 keys.json
    if (!fs.existsSync(KEYS_FILE)) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // 初始化 bindings.json
    if (!fs.existsSync(BINDINGS_FILE)) {
        fs.writeFileSync(BINDINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // 初始化 blacklist.json
    if (!fs.existsSync(BLACKLIST_FILE)) {
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify([], null, 2), 'utf-8');
    }

    // 初始化 admin_key.json（如果不存在则创建一个默认的管理员KEY）
    if (!fs.existsSync(ADMIN_KEY_FILE)) {
        const defaultAdminKey: KeyRecord = {
            key: 'admin_master_key',
            quota: 'inf',
            total_quota: 'inf',
            permission: 'admin',
            creator_qq: 'system',
            created_at: new Date().toISOString()
        };
        fs.writeFileSync(ADMIN_KEY_FILE, JSON.stringify(defaultAdminKey, null, 2), 'utf-8');
    }
}

// ============ 读取操作 ============

/**
 * 读取所有KEY记录
 */
function readKeys(): KeyRecord[] {
    initDataFiles();
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf-8');
        return JSON.parse(data) as KeyRecord[];
    } catch (error) {
        console.error('读取KEY记录失败:', error);
        return [];
    }
}

/**
 * 读取QQ绑定关系
 */
function readBindings(): QqKeyBinding[] {
    initDataFiles();
    try {
        const data = fs.readFileSync(BINDINGS_FILE, 'utf-8');
        return JSON.parse(data) as QqKeyBinding[];
    } catch (error) {
        console.error('读取绑定关系失败:', error);
        return [];
    }
}

/**
 * 读取黑名单
 */
function readBlacklist(): BlacklistRecord[] {
    initDataFiles();
    try {
        const data = fs.readFileSync(BLACKLIST_FILE, 'utf-8');
        return JSON.parse(data) as BlacklistRecord[];
    } catch (error) {
        console.error('读取黑名单失败:', error);
        return [];
    }
}

/**
 * 读取管理员KEY
 */
function readAdminKey(): KeyRecord | null {
    initDataFiles();
    try {
        const data = fs.readFileSync(ADMIN_KEY_FILE, 'utf-8');
        return JSON.parse(data) as KeyRecord;
    } catch (error) {
        console.error('读取管理员KEY失败:', error);
        return null;
    }
}

// ============ 写入操作 ============

/**
 * 保存所有KEY记录
 */
function saveKeys(keys: KeyRecord[]): boolean {
    try {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存KEY记录失败:', error);
        return false;
    }
}

/**
 * 保存绑定关系
 */
function saveBindings(bindings: QqKeyBinding[]): boolean {
    try {
        fs.writeFileSync(BINDINGS_FILE, JSON.stringify(bindings, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存绑定关系失败:', error);
        return false;
    }
}

/**
 * 保存黑名单
 */
function saveBlacklist(blacklist: BlacklistRecord[]): boolean {
    try {
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(blacklist, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('保存黑名单失败:', error);
        return false;
    }
}

// ============ 核心业务逻辑 ============

/**
 * 生成随机KEY字符串
 */
function generateKeyString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

/**
 * 验证权限是否足够执行某操作
 */
export function hasPermission(key: string, requiredPermission: KeyPermission): boolean {
    // 首先检查是否是管理员KEY
    const adminKey = readAdminKey();
    if (adminKey && adminKey.key === key) {
        const permissionLevels: Record<KeyPermission, number> = {
            'admin': 4,
            'op': 3,
            'user': 2,
            'visitor': 1
        };
        return permissionLevels[adminKey.permission] >= permissionLevels[requiredPermission];
    }

    // 检查普通KEY
    const keys = readKeys();
    const keyRecord = keys.find(k => k.key === key);

    if (!keyRecord) {
        return false;
    }

    const permissionLevels: Record<KeyPermission, number> = {
        'admin': 4,
        'op': 3,
        'user': 2,
        'visitor': 1
    };

    return permissionLevels[keyRecord.permission] >= permissionLevels[requiredPermission];
}

/**
 * 验证管理员KEY
 */
export function verifyAdminKey(inputKey: string): boolean {
    const adminKey = readAdminKey();
    return adminKey !== null && adminKey.key === inputKey;
}

/**
 * 创建新KEY
 * @param creatorKey 创建者的KEY
 * @param quota 额度（正整数或'inf'）
 * @param permission 权限组
 * @param creatorQq 创建者QQ号
 * @returns 创建结果
 */
export function createKey(
    creatorKey: string,
    quota: QuotaValue,
    permission: KeyPermission,
    creatorQq: string
): { success: boolean; key?: string; error?: string } {
    // 验证创建者权限（需要op及以上权限）
    if (!verifyAdminKey(creatorKey) && !hasPermission(creatorKey, 'op')) {
        return { success: false, error: '权限不足，需要admin或op权限' };
    }

    // 验证额度
    if (quota !== 'inf' && (typeof quota !== 'number' || quota < 1 || !Number.isInteger(quota))) {
        return { success: false, error: '额度必须是正整数或"inf"' };
    }

    // 验证权限组
    const validPermissions: KeyPermission[] = ['admin', 'op', 'user', 'visitor'];
    if (!validPermissions.includes(permission)) {
        return { success: false, error: '无效的权限组' };
    }

    // 生成唯一KEY
    let newKey: string;
    let keyExists = true;
    const keys = readKeys();

    do {
        newKey = generateKeyString();
        keyExists = keys.some(k => k.key === newKey);
    } while (keyExists);

    // 创建KEY记录
    const keyRecord: KeyRecord = {
        key: newKey,
        quota: quota,
        total_quota: quota,
        permission: permission,
        creator_qq: creatorQq,
        created_at: new Date().toISOString()
    };

    keys.push(keyRecord);

    if (saveKeys(keys)) {
        return { success: true, key: newKey };
    } else {
        return { success: false, error: '保存KEY失败' };
    }
}

/**
 * 查询KEY信息
 */
export function checkKey(key: string): KeyRecord | null {
    const keys = readKeys();
    const keyRecord = keys.find(k => k.key === key);

    if (keyRecord) {
        // 返回副本，避免意外修改
        return { ...keyRecord };
    }
    return null;
}

/**
 * 验证QQ号是否有KEY且额度足够
 * @returns 验证结果：{ valid: boolean, key?: KeyRecord, error?: string }
 */
export function verifyQqKey(qqNum: string): {
    valid: boolean;
    key?: KeyRecord;
    error?: string
} {
    // 检查黑名单
    const blacklist = readBlacklist();
    const blocked = blacklist.find(b => b.qq_num === qqNum);
    if (blocked) {
        return { valid: false, error: `你已被禁用，原因：${blocked.reason}` };
    }

    // 首先检查管理员KEY的绑定
    const adminKey = readAdminKey();
    if (adminKey && adminKey.bound_qq === qqNum) {
        return { valid: true, key: adminKey };
    }

    // 查找QQ绑定的KEY
    const bindings = readBindings();
    const binding = bindings.find(b => b.qq_num === qqNum);

    if (!binding) {
        return { valid: false, error: '需要输入KEY来使用' };
    }

    // 检查KEY是否存在且额度足够
    const keyRecord = checkKey(binding.key);
    if (!keyRecord) {
        // KEY不存在，解除绑定
        const newBindings = bindings.filter(b => b.qq_num !== qqNum);
        saveBindings(newBindings);
        return { valid: false, error: 'KEY不存在，需要重新绑定' };
    }

    // 检查额度（无限额度直接通过）
    if (keyRecord.quota === 'inf') {
        return { valid: true, key: keyRecord };
    }

    // 检查剩余额度
    if (keyRecord.quota <= 0) {
        return { valid: false, error: 'KEY额度已用尽' };
    }

    return { valid: true, key: keyRecord };
}

/**
 * 扣除KEY额度
 * @param key 要扣除额度的KEY
 * @returns 扣除结果
 */
export function deductKeyQuota(key: string): { success: boolean; error?: string } {
    const keys = readKeys();
    const keyIndex = keys.findIndex(k => k.key === key);

    if (keyIndex === -1) {
        // 检查是否是管理员KEY
        const adminKey = readAdminKey();
        if (adminKey && adminKey.key === key) {
            // 管理员KEY不扣除额度
            return { success: true };
        }
        return { success: false, error: 'KEY不存在' };
    }

    // 无限额度不扣除
    if (keys[keyIndex].quota === 'inf') {
        return { success: true };
    }

    // 扣除1点额度
    if (keys[keyIndex].quota > 0) {
        keys[keyIndex].quota = (keys[keyIndex].quota as number) - 1;
        if (saveKeys(keys)) {
            return { success: true };
        } else {
            return { success: false, error: '保存KEY失败' };
        }
    } else {
        return { success: false, error: 'KEY额度已用尽' };
    }
}

/**
 * 为QQ号绑定KEY
 */
export function bindKeyToQq(qqNum: string, key: string): { success: boolean; error?: string } {
    const keyRecord = checkKey(key);
    if (!keyRecord) {
        return { success: false, error: 'KEY不存在' };
    }

    // 检查KEY额度
    if (keyRecord.quota !== 'inf' && keyRecord.quota <= 0) {
        return { success: false, error: 'KEY额度已用尽' };
    }

    const bindings = readBindings();

    // 检查是否已绑定其他KEY
    const existingBinding = bindings.find(b => b.qq_num === qqNum);
    if (existingBinding) {
        // 解除旧KEY的绑定（不回收额度）
        const newBindings = bindings.filter(b => b.qq_num !== qqNum);
        newBindings.push({
            qq_num: qqNum,
            key: key,
            bound_at: new Date().toISOString()
        });
        saveBindings(newBindings);
    } else {
        // 新绑定，扣除额度
        const keys = readKeys();
        const keyIndex = keys.findIndex(k => k.key === key);
        if (keyIndex !== -1) {
            if (keys[keyIndex].quota !== 'inf') {
                keys[keyIndex].quota = (keys[keyIndex].quota as number) - 1;
                saveKeys(keys);
            }
        }

        bindings.push({
            qq_num: qqNum,
            key: key,
            bound_at: new Date().toISOString()
        });
        saveBindings(bindings);
    }

    return { success: true };
}

/**
 * 解除QQ号的KEY绑定
 */
export function unbindKeyFromQq(qqNum: string): { success: boolean; error?: string } {
    const bindings = readBindings();
    const binding = bindings.find(b => b.qq_num === qqNum);

    if (!binding) {
        return { success: false, error: '该QQ号未绑定KEY' };
    }

    const newBindings = bindings.filter(b => b.qq_num !== qqNum);

    if (saveBindings(newBindings)) {
        return { success: true };
    } else {
        return { success: false, error: '解除绑定失败' };
    }
}

/**
 * 回收KEY额度（当用户解绑或管理员操作时）
 * 注意：这个函数在当前设计中不再自动调用，因为绑定时已扣除额度
 */
export function recycleKeyQuota(key: string, qqNum: string): boolean {
    const keys = readKeys();
    const keyIndex = keys.findIndex(k => k.key === key);

    if (keyIndex === -1) {
        return false;
    }

    if (keys[keyIndex].quota === 'inf') {
        return true; // 无限额度不需要回收
    }

    keys[keyIndex].quota = (keys[keyIndex].quota as number) + 1;
    return saveKeys(keys);
}

/**
 * 获取管理员KEY
 */
export function getAdminKey(): string {
    const adminKey = readAdminKey();
    return adminKey ? adminKey.key : '';
}

/**
 * 将QQ号加入黑名单
 */
export function addToBlacklist(
    qqNum: string,
    reason: string,
    blockedBy: string
): { success: boolean; error?: string } {
    const blacklist = readBlacklist();

    // 检查是否已在黑名单
    if (blacklist.some(b => b.qq_num === qqNum)) {
        return { success: false, error: '该QQ号已在黑名单中' };
    }

    blacklist.push({
        qq_num: qqNum,
        reason: reason,
        blocked_at: new Date().toISOString(),
        blocked_by: blockedBy
    });

    if (saveBlacklist(blacklist)) {
        // 同时解除KEY绑定
        unbindKeyFromQq(qqNum);
        return { success: true };
    } else {
        return { success: false, error: '加入黑名单失败' };
    }
}

// 初始化
initDataFiles();

console.log('[KEY系统] KEY管理系统已初始化');
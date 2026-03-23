/**
 * KEY权限组类型
 * - admin: 管理员，可以创建KEY
 * - op: 操作员，可以创建KEY
 * - user: 普通用户，使用KEY
 * - visitor: 访客，仅查看（预留）
 */
export type KeyPermission = 'admin' | 'op' | 'user' | 'visitor';

/**
 * 额度类型：正整数或"inf"（无限）
 */
export type QuotaValue = number | 'inf';

/**
 * KEY记录结构
 */
export interface KeyRecord {
    key: string;              // KEY字符串（如"ABC123"）
    quota: QuotaValue;        // 剩余额度
    total_quota: QuotaValue;  // 初始总额度
    permission: KeyPermission; // 权限组
    creator_qq: string;       // 创建者QQ号
    created_at: string;       // 创建时间（ISO格式）
    bound_qq?: string;        // 绑定的QQ号（可选）
}

/**
 * QQ到KEY的绑定关系
 */
export interface QqKeyBinding {
    qq_num: string;   // QQ号
    key: string;      // 绑定的KEY
    bound_at: string; // 绑定时间
}

/**
 * 用户黑名单（被禁用的QQ号）
 */
export interface BlacklistRecord {
    qq_num: string;
    reason: string;
    blocked_at: string;
    blocked_by: string;
}
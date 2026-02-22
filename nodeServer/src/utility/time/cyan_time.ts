// ==========================================
// CyanAI 字符串时间运算核心系统 (CyanTime)
// ==========================================

// 定义标准单位转化常量 (相对于毫秒)
const UNITS = {
    ms: 1,
    s: 1000,
    min: 60 * 1000,
    h: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000, // 抽象标准月
    year: 365 * 24 * 60 * 60 * 1000  // 抽象标准年
};

// 获取绝对原点 (Year 0, Month 1, Day 1, 00:00:00) 的底层时间戳
// 避免 JS 的 1900 年 Bug
const EPOCH_MS = (function initEpoch() {
    const d = new Date(Date.UTC(0, 0, 1, 0, 0, 0));
    d.setUTCFullYear(0); 
    return d.getTime();
})();

// ================= 底层解析 & 格式化引擎 =================

function parseUnit(str: string): string {
    if (/^-?\d{8}_\d{6}$/.test(str)) return 'timestamp';
    const match = str.match(/^-?\d+(?:\.\d+)?(ms|s|min|h|day|week|month|year)$/);
    if (match) return match[1];
    throw new Error(`[CyanTime] 无法识别的后缀或格式: ${str}`);
}

function toMs(str: string): number {
    const unit = parseUnit(str);
    if (unit === 'timestamp') {
        const isNegative = str.startsWith('-');
        const cleanStr = isNegative ? str.slice(1) : str;
        const Y = parseInt(cleanStr.slice(0, 4), 10);
        const M = parseInt(cleanStr.slice(4, 6), 10) - 1; // JS 月份 0-11
        const D = parseInt(cleanStr.slice(6, 8), 10);
        const H = parseInt(cleanStr.slice(9, 11), 10);
        const m = parseInt(cleanStr.slice(11, 13), 10);
        const s = parseInt(cleanStr.slice(13, 15), 10);
        
        const d = new Date(Date.UTC(Y, M, D, H, m, s));
        d.setUTCFullYear(Y);
        const absMs = d.getTime() - EPOCH_MS;
        return isNegative ? -absMs : absMs;
    } else {
        const val = parseFloat(str); // parseFloat 会自动丢弃后面的字母后缀
        return val * UNITS[unit as keyof typeof UNITS];
    }
}

function fromMs(ms: number, targetUnit: string): string {
    if (targetUnit === 'timestamp') {
        const isNegative = ms < 0;
        const absMs = Math.abs(ms);
        const d = new Date(EPOCH_MS + absMs);
        
        const Y = d.getUTCFullYear().toString().padStart(4, '0');
        const M = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const D = d.getUTCDate().toString().padStart(2, '0');
        const H = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        const s = d.getUTCSeconds().toString().padStart(2, '0');
        
        const ts = `${Y}${M}${D}_${H}${m}${s}`;
        return isNegative ? `-${ts}` : ts;
    } else {
        const val = ms / UNITS[targetUnit as keyof typeof UNITS];
        // 去除多余的浮点误差，比如将 1.0000000001 转回 1
        const cleanVal = parseFloat(val.toFixed(8)); 
        return `${cleanVal}${targetUnit}`;
    }
}

// ================= 对外暴露的 API =================

/** 将时间戳字符串或者单位字符串转化为单位 (用于修改输出格式) */
export function convert(str: string, targetUnit: string): string {
    return fromMs(toMs(str), targetUnit);
}

/** 加法：输出单位以 a 为准 */
export function add(a: string, b: string): string {
    const msA = toMs(a);
    const msB = toMs(b);
    return fromMs(msA + msB, parseUnit(a));
}

/** 减法：输出单位以 a 为准 */
export function sub(a: string, b: string): string {
    const msA = toMs(a);
    const msB = toMs(b);
    return fromMs(msA - msB, parseUnit(a));
}

/** 乘法：第二个参数必须是 number */
export function mul(a: string, b: number): string {
    return fromMs(toMs(a) * b, parseUnit(a));
}

/** 除法：第二个参数必须是 number */
export function div(a: string, b: number): string {
    if (b === 0) throw new Error("[CyanTime] 除数不能为 0");
    return fromMs(toMs(a) / b, parseUnit(a));
}

/** 
 * 比较大小 (允许单位不同)
 * @returns 1 (a > b), -1 (a < b), 0 (a === b)
 */
export function compare(a: string, b: string): 1 | -1 | 0 {
    const diff = toMs(a) - toMs(b);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
    return 0;
}

/** 剥离单位，仅提取数字部分 (负号会被保留) */
export function timeStringToNum(str: string): number {
    // 正则去除所有英文字母和下划线
    const cleaned = str.replace(/[a-zA-Z_]/g, '');
    return Number(cleaned);
}

/** 
 * 将任何字符串可视化为：XXyearXXmonthXXdayXXhourXXminXXsXXms 
 * 项为 0 则省略
 */
export function timeShow(str: string): string {
    let ms = Math.abs(toMs(str));
    if (ms === 0) return "0s"; // 规避全 0 导致空字符串

    const y = Math.floor(ms / UNITS.year); ms %= UNITS.year;
    const mo = Math.floor(ms / UNITS.month); ms %= UNITS.month;
    const d = Math.floor(ms / UNITS.day); ms %= UNITS.day;
    const h = Math.floor(ms / UNITS.h); ms %= UNITS.h;
    const m = Math.floor(ms / UNITS.min); ms %= UNITS.min;
    const s = Math.floor(ms / UNITS.s); ms %= UNITS.s;
    const rMs = ms;

    let res = "";
    if (y > 0) res += `${y}year`;
    if (mo > 0) res += `${mo}month`;
    if (d > 0) res += `${d}day`;
    if (h > 0) res += `${h}hour`;
    if (m > 0) res += `${m}min`;
    if (s > 0) res += `${s}s`;
    if (rMs > 0 || res === "") res += `${rMs}ms`;

    return str.startsWith('-') ? `-${res}` : res;
}

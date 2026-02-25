/**
 * Event Loader - 加载历史对话事件
 * 
 * TOP 100 决定位置：第 171 行 - eventsWithWeight.slice(0, 100)
 * 如果需要修改返回数量，请修改 slice(0, 100) 中的 100
 */
//这个文件的目的是读取events文件夹里面的事件，然后据此生成每次对话最开始event列表
//其输出是是这样一个数组
/*
[
{source:"这里是事件来源的文件路径，不是简介文件而是完整记载事件的文件",current:"这里装的是转义后的文本"}
...
]
 */
//文件源在主目录的library_source.ini里
import * as fs from 'fs';
import * as path from 'path';
import { readIni } from '../../utility/file_operation/read_ini';
import { convert, timeStringToNum } from '../../utility/time/cyan_time';
import { getEntry, getEntryCount, CyanEntry } from '../../utility/ent_operation/ent_manager';

// ================= 类型定义 =================

//引入了
import {LinesP,EventOutputItem} from '../../types/process/process.type'

// ================= 内部辅助函数 =================

/**
 * 递归扫描目录下所有的 .ent 文件
 */
function scanEntFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            scanEntFiles(fullPath, fileList);
        } else if (file.endsWith('.ent')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

/**
 * 获取当前时间的标准时间戳 (符合 cyan_time.ts 规范 YYYYMMDD_HHMMSS)
 */
function getNowTimestamp(): string {
    const d = new Date();
    const Y = d.getFullYear().toString().padStart(4, '0');
    const M = (d.getMonth() + 1).toString().padStart(2, '0');
    const D = d.getDate().toString().padStart(2, '0');
    const H = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${Y}${M}${D}_${H}${m}${s}`;
}

function logErrorToFile(error: Error, context: string): void {
    const errorOutputDir = path.join(__dirname, '..', '..', 'error-output');
    
    if (!fs.existsSync(errorOutputDir)) {
        fs.mkdirSync(errorOutputDir, { recursive: true });
    }

    const timestamp = getNowTimestamp();
    const errorFileName = `${timestamp}.txt`;
    const errorFilePath = path.join(errorOutputDir, errorFileName);

    const errorContent = [
        `时间: ${new Date().toLocaleString()}`,
        `上下文: ${context}`,
        `错误信息: ${error.message}`,
        `堆栈跟踪:`,
        error.stack || '无堆栈信息'
    ].join('\n');

    fs.writeFileSync(errorFilePath, errorContent, 'utf-8');
}//这个函数其实是重复实现的，之后再重构吧

// ================= 核心导出 API =================

/**
 * 从主配置加载并筛选 Top 100 对话事件
 * @returns 经过权重排序的 Top 100 事件数组
 */
export function loadInitialEvents(): EventOutputItem[] {
    try {
        const iniFilePath = path.join(__dirname, '..', '..', '..', 'library_source.ini');
        const eventFolder = readIni(iniFilePath, 'event_folder');
        const summaryFolder = readIni(iniFilePath, 'event_summary_folder');

        const entFiles = scanEntFiles(summaryFolder);
        const eventsWithWeight: Array<{ item: EventOutputItem, weight: number }> = [];

        const nowTs = getNowTimestamp();
        const nowMsStr = convert(nowTs, 'ms');
        const nowMs = timeStringToNum(nowMsStr);

        for (const filePath of entFiles) {
            try {
                const entry: CyanEntry = getEntry(filePath, 1);
                
                const eventTs = entry.TIMESET;
                const eventMsStr = convert(eventTs, 'ms');
                const eventMs = timeStringToNum(eventMsStr);
                
                const diffMs = Math.max(0, nowMs - eventMs);
                const diffDays = diffMs / (24 * 60 * 60 * 1000);

                let Tw = 0.05;
                if (diffDays < 3) Tw = 1;
                else if (diffDays < 7) Tw = 0.6;
                else if (diffDays < 30) Tw = 0.3;
                else if (diffDays < 365) Tw = 0.1;

                if (!entry.extraCurrent || entry.extraCurrent.Im === undefined) {
                    const error = new Error(`[CyanEventLoader] summary 文件缺少 Im 字段: ${filePath}`);
                    logErrorToFile(error, '读取 summary 文件 extraCurrent.Im');
                    throw error;
                }

                const Im = entry.extraCurrent.Im;
                const R = entry.memory_state?.R || 0;

                const weight = R * 10 * Im * Tw;
                
                if (Im <= 0 || weight <= 0) continue;

                const relativePath = path.relative(summaryFolder, filePath);
                const realEventPath = path.join(eventFolder, relativePath);

                let entryCount: number;
                try {
                    entryCount = getEntryCount(realEventPath);
                } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    logErrorToFile(err, `读取真实 event 文件条目数: ${realEventPath}`);
                    throw err;
                }

                if (entryCount === 0) {
                    const error = new Error(`[CyanEventLoader] 真实 event 文件为空: ${realEventPath}`);
                    logErrorToFile(error, '检查真实 event 文件');
                    throw error;
                }

                const linesP: LinesP = {
                    path: realEventPath,
                    index: "order",
                    reference: [{
                        start: "1",
                        end: entryCount.toString()
                    }]
                };

                eventsWithWeight.push({
                    item: {
                        source: linesP,
                        current: entry.current
                    },
                    weight
                });

            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                console.warn(`[CyanEventLoader] 处理事件简介失败跳过: ${filePath}`, err);
            }
        }

        eventsWithWeight.sort((a, b) => b.weight - a.weight);

        return eventsWithWeight.slice(0, 100).map(ew => ew.item);

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logErrorToFile(err, 'loadInitialEvents 主函数');
        throw err;
    }
}

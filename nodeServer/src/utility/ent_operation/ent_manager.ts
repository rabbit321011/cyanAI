import * as fs from 'fs';

export interface MemoryState {
  R: number;
  S: number;
  last_T_distance: string;
  D: number;
  a: number;
}

export interface CyanEntry {
  memory_state: MemoryState;
  current: string;
  extraCurrent: any;
  TIMESET: string;
}

function readValidLines(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split(/\r?\n/).filter(line => line.trim().length > 0);
}

export function getEntry(filePath: string, n: number): CyanEntry {
  if (n < 1) throw new Error(`[CyanEntManager] 序号 n 必须 >= 1，当前传入: ${n}`);
  const lines = readValidLines(filePath);
  
  if (n > lines.length) {
    throw new Error(`[CyanEntManager] 序号 n(${n}) 越界，文件总条目数为 ${lines.length}`);
  }

  try {
    return JSON.parse(lines[n - 1]) as CyanEntry;
  } catch (error) {
    throw new Error(`[CyanEntManager] 第 ${n} 行数据 JSON 解析失败: ${error}`);
  }
}

export function updateEntry(filePath: string, n: number, entry: CyanEntry): void {
  if (n < 1) throw new Error(`[CyanEntManager] 序号 n 必须 >= 1，当前传入: ${n}`);
  const lines = readValidLines(filePath);

  if (n > lines.length) {
    throw new Error(`[CyanEntManager] 更新失败：第 ${n} 条数据不存在。当前文件总条目数为 ${lines.length}`);
  }

  lines[n - 1] = JSON.stringify(entry);

  const newContent = lines.join('\n') + '\n';
  fs.writeFileSync(filePath, newContent, 'utf-8');
}

export function getEntryCount(filePath: string): number {
  return readValidLines(filePath).length;
}

export function appendEntry(filePath: string, entry: CyanEntry): void {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '', 'utf-8');
  }
  const lineStr = JSON.stringify(entry) + '\n';
  fs.appendFileSync(filePath, lineStr, 'utf-8');
}

export function findEntryLineByCurrent(filePath: string, currentText: string): number {
  const lines = readValidLines(filePath);
  
  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]) as CyanEntry;
      if (parsed.current === currentText) {
        return i + 1;
      }
    } catch (error) {
      console.warn(`[CyanEntManager] 检索时跳过损坏的第 ${i + 1} 行`);
    }
  }
  return -1;
}

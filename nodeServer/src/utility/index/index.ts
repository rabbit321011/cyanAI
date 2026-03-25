import * as fs from 'fs';
import * as path from 'path';
import { readIni } from '../file_operation/read_ini';
import { writeIni } from '../file_operation/write_ini';

const INDEX_FILE = path.join(__dirname, '../../../dataBase/index/indexs.ini');

function ensureIndexFile(): void {
    const dir = path.dirname(INDEX_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(INDEX_FILE)) {
        fs.writeFileSync(INDEX_FILE, '', 'utf-8');
    }
}

function getAllIndexes(): Map<string, string> {
    ensureIndexFile();
    const content = fs.readFileSync(INDEX_FILE, 'utf-8');
    const map = new Map<string, string>();
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') continue;
        const equalIndex = trimmed.indexOf('=');
        if (equalIndex === -1) continue;
        const key = trimmed.slice(0, equalIndex).trim();
        const value = trimmed.slice(equalIndex + 1).trim();
        if (key && value) {
            map.set(key, value);
        }
    }
    return map;
}

function getNextIndexNumber(): number {
    const indexes = getAllIndexes();
    let maxNum = 0;
    for (const key of indexes.keys()) {
        const match = key.match(/^index-(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
                maxNum = num;
            }
        }
    }
    return maxNum + 1;
}

export function clear_index(): string {
    try {
        ensureIndexFile();
        fs.writeFileSync(INDEX_FILE, '', 'utf-8');
        return 'SUCCESS:索引已清空';
    } catch (error) {
        return `ERROR:${error}`;
    }
}

export function add_index(source: string): string {
    try {
        if (!source || source.trim() === '') {
            return 'ERROR:source不能为空';
        }
        
        const indexes = getAllIndexes();
        
        for (const [key, value] of indexes.entries()) {
            if (value === source) {
                return `ERROR:该source已存在，index为${key}`;
            }
        }
        
        const nextNum = getNextIndexNumber();
        const newIndex = `index-${nextNum}`;
        
        writeIni(INDEX_FILE, newIndex, source);
        
        return `SUCCESS:${newIndex}`;
    } catch (error) {
        return `ERROR:${error}`;
    }
}

export function query_index(source: string): string {
    try {
        const indexes = getAllIndexes();
        
        for (const [key, value] of indexes.entries()) {
            if (value === source) {
                return key;
            }
        }
        
        return '';
    } catch (error) {
        return '';
    }
}

export function query_source(index: string): string {
    try {
        const result = readIni(INDEX_FILE, index);
        return result;
    } catch (error) {
        return '';
    }
}

export function exists_index(index: string): boolean {
    const indexes = getAllIndexes();
    return indexes.has(index);
}

export function exists_source(source: string): boolean {
    const indexes = getAllIndexes();
    for (const value of indexes.values()) {
        if (value === source) {
            return true;
        }
    }
    return false;
}

export function remove_index(index: string): string {
    try {
        const indexes = getAllIndexes();
        
        if (!indexes.has(index)) {
            return 'ERROR:index不存在';
        }
        
        const newContent: string[] = [];
        for (const [key, value] of indexes.entries()) {
            if (key !== index) {
                newContent.push(`${key}=${value}`);
            }
        }
        
        fs.writeFileSync(INDEX_FILE, newContent.join('\n'), 'utf-8');
        
        return 'SUCCESS:删除成功';
    } catch (error) {
        return `ERROR:${error}`;
    }
}

export function remove_source(source: string): string {
    try {
        const indexes = getAllIndexes();
        
        let foundKey: string | null = null;
        for (const [key, value] of indexes.entries()) {
            if (value === source) {
                foundKey = key;
                break;
            }
        }
        
        if (!foundKey) {
            return 'ERROR:source不存在';
        }
        
        const newContent: string[] = [];
        for (const [key, value] of indexes.entries()) {
            if (value !== source) {
                newContent.push(`${key}=${value}`);
            }
        }
        
        fs.writeFileSync(INDEX_FILE, newContent.join('\n'), 'utf-8');
        
        return 'SUCCESS:删除成功';
    } catch (error) {
        return `ERROR:${error}`;
    }
}

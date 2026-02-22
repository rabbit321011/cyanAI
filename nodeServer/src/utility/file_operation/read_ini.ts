import * as fs from 'fs';
import * as path from 'path';

export function readIni(filePath: string, key: string): string {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const iniMap = new Map<string, string>();

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            continue;
        }

        const equalIndex = trimmedLine.indexOf('=');
        if (equalIndex === -1) {
            throw new Error('Invalid INI file: line must contain an equals sign');
        }

        const currentKey = trimmedLine.slice(0, equalIndex).trim();
        const currentValue = trimmedLine.slice(equalIndex + 1).trim();

        if (currentKey === '') {
            throw new Error('Invalid INI file: key cannot be empty');
        }

        if (currentValue.includes('\n') || currentValue.includes('\r')) {
            throw new Error('Invalid INI file: value cannot contain newlines');
        }

        iniMap.set(currentKey, currentValue);
    }

    return iniMap.get(key) || '';
}

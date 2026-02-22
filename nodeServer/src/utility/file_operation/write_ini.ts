import * as fs from 'fs';

export function writeIni(filePath: string, key: string, value: string): void {
    if (value.includes('\n') || value.includes('\r')) {
        throw new Error('Invalid value: cannot contain newlines');
    }

    const trimmedKey = key.trim();
    if (trimmedKey === '') {
        throw new Error('Invalid key: cannot be empty');
    }

    let iniMap = new Map<string, string>();

    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split(/\r?\n/);

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
    }

    iniMap.set(trimmedKey, value.trim());

    let content = '';
    for (const [k, v] of iniMap) {
        content += `${k}=${v}\n`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
}

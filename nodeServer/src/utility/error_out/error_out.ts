import { now } from '../time/cyan_time';
import * as fs from 'fs';
import * as path from 'path';

export function error_out(message: string): void {
    const timestamp = now();
    const fileName = `${timestamp}.txt`;
    const outputDir = path.join(__dirname, '../../../error-output');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, message, 'utf-8');
}

export function isError(str: string): boolean {
    return str.startsWith('ERROR');
}

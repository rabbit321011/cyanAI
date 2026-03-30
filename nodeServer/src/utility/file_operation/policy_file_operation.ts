import * as fs from 'fs';
import { policy_group } from '../../types/process/process.type';

export function readPolicyGroup(filePath: string): policy_group {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Policy group file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as policy_group;
    return data;
}

export function writePolicyGroup(filePath: string, data: policy_group): void {
    const content = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, content, 'utf-8');
}

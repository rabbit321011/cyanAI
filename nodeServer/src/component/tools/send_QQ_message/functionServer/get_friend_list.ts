import fs from 'fs';
import { QQgetFriend } from '../../../../utility/QQ/qq';

export const execute = async (params: any, work_file: string) => {
    const result = await QQgetFriend();
    
    let output: string;
    if (typeof result === 'string') {
        output = result;
    } else {
        output = `获取到 ${result.length} 个好友:\n` + 
            result.map((f, i) => `${i + 1}. ${f.name} (${f.qq_num})`).join('\n');
    }
    
    fs.writeFileSync(work_file, JSON.stringify({ result: output }), 'utf-8');
    
    return output;
};

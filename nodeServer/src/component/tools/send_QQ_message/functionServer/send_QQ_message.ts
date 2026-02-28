import fs from 'fs';
import path from 'path';
import { QQsendMessage, QQsendImg, QQsendAudio } from '../../../../utility/QQ/qq';

const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.amr', '.silk', '.ogg', '.m4a'];

export const execute = async (params: any, work_file: string) => {
    const { send_text, aim_qq_num } = params;
    const results: string[] = [];
    
    if (!send_text || !aim_qq_num) {
        return "ERROR:缺少必要参数 send_text 或 aim_qq_num";
    }
    
    const segments = send_text.split('@br');
    
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        
        if (!segment || segment.trim() === '') {
            continue;
        }
        
        const fileMatch = segment.match(/^%\[(.+)\]$/);
        
        if (fileMatch) {
            const filePath = fileMatch[1];
            const ext = path.extname(filePath).toLowerCase();
            
            if (!fs.existsSync(filePath)) {
                const sendResult = await QQsendMessage(aim_qq_num, `%[${filePath}]`);
                results.push(`文本段${i + 1}: 文件不存在，发送原始文本 - ${sendResult}`);
                continue;
            }
            
            if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
                const sendResult = await QQsendImg(aim_qq_num, filePath);
                results.push(`图片段${i + 1}: ${filePath} - ${sendResult}`);
            } else if (SUPPORTED_AUDIO_EXTENSIONS.includes(ext)) {
                const sendResult = await QQsendAudio(aim_qq_num, filePath);
                results.push(`语音段${i + 1}: ${filePath} - ${sendResult}`);
            } else {
                const sendResult = await QQsendMessage(aim_qq_num, `%[${filePath}]`);
                results.push(`文本段${i + 1}: 不支持的文件格式${ext}，发送原始文本 - ${sendResult}`);
            }
        } else {
            const sendResult = await QQsendMessage(aim_qq_num, segment);
            results.push(`文本段${i + 1}: "${segment.substring(0, 20)}${segment.length > 20 ? '...' : ''}" - ${sendResult}`);
        }
    }
    
    const summary = results.join('\n');
    fs.writeFileSync(work_file, JSON.stringify({ result: summary }), 'utf-8');
    
    return summary;
};

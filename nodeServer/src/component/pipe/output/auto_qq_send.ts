import { QQsendMessage, QQsendImg, QQsendFile } from '../../../utility/QQ/qq';
import { multi_contact_multimedia_message, multi_contact_multimedia_message_array, multimedia_message, inlineData } from '../../../types/process/process.type';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = path.join(__dirname, '../../../../dataBase/temp/sending_base64');

function ensureTempDir(): void {
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
}

function getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/bmp': '.bmp'
    };
    return mimeMap[mimeType] || '.jpg';
}

async function sendInline(id: string, inline: inlineData, index: number): Promise<string> {
    ensureTempDir();
    
    const ext = getExtensionFromMimeType(inline.mimeType);
    const tempFileName = `temp_${Date.now()}_${index}${ext}`;
    const tempFilePath = path.join(TEMP_DIR, tempFileName);
    
    try {
        const buffer = Buffer.from(inline.data, 'base64');
        fs.writeFileSync(tempFilePath, buffer);
        
        const result = await QQsendImg(id, tempFilePath);
        
        fs.unlinkSync(tempFilePath);
        
        return result;
    } catch (error: any) {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        return `ERROR:发送图片失败:${error.message}`;
    }
}

async function sendMessage(msg: multi_contact_multimedia_message): Promise<void> {
    const { id, name, parts } = msg;
    
    if (!id) {
        console.error('auto_qq_send: data 中缺少 id');
        return;
    }
    
    for (const part of parts) {
        if (part.type === 'text' && part.content) {
            const result = await QQsendMessage(id, part.content);
            console.log(`[auto_qq_send] 文本发送到 ${name}(${id}): ${result}`);
        } else if (part.type === 'image' && part.inline) {
            const result = await sendInline(id, part.inline, 0);
            console.log(`[auto_qq_send] 图片发送到 ${name}(${id}): ${result}`);
        }
    }
}

export async function output(runtime_data: any, data: multi_contact_multimedia_message_array): Promise<void> {
    for (const msg of data.messages) {
        await sendMessage(msg);
    }
}

export function get_type(): string {
    return "multi_contact_multimedia_message_array";
}

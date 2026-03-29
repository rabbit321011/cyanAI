import { QQsendMessage, QQsendImg, QQsendAudio, QQsendFile } from '../../../utility/QQ/qq';
import { multi_contact_multimedia_message_array, inlineData } from '../../../types/process/process.type';
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
        'image/bmp': '.bmp',
        'audio/amr': '.amr',
        'audio/mp3': '.mp3',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',
        'audio/mp4': '.m4a',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'application/octet-stream': '.bin'
    };
    return mimeMap[mimeType] || '.bin';
}

function getSendTypeFromMimeType(mimeType: string): 'image' | 'audio' | 'video' | 'file' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
}

async function sendInlineImage(qq: string, inline: inlineData, index: number): Promise<string> {
    ensureTempDir();

    const ext = getExtensionFromMimeType(inline.mimeType);
    const tempFileName = `temp_${Date.now()}_${index}${ext}`;
    const tempFilePath = path.join(TEMP_DIR, tempFileName);

    try {
        const buffer = Buffer.from(inline.data, 'base64');
        fs.writeFileSync(tempFilePath, buffer);

        const result = await QQsendImg(qq, tempFilePath);

        fs.unlinkSync(tempFilePath);

        return result;
    } catch (error: any) {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        return `ERROR:发送图片失败:${error.message}`;
    }
}

async function sendInlineFile(qq: string, inline: inlineData, index: number, sendType: 'audio' | 'video' | 'file'): Promise<string> {
    ensureTempDir();

    const ext = getExtensionFromMimeType(inline.mimeType);
    const tempFileName = `temp_${Date.now()}_${index}${ext}`;
    const tempFilePath = path.join(TEMP_DIR, tempFileName);

    try {
        const buffer = Buffer.from(inline.data, 'base64');
        fs.writeFileSync(tempFilePath, buffer);

        let result: string;
        if (sendType === 'audio') {
            result = await QQsendAudio(qq, tempFilePath);
        } else {
            result = await QQsendFile(qq, tempFilePath);
        }

        fs.unlinkSync(tempFilePath);

        return result;
    } catch (error: any) {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        return `ERROR:发送文件失败:${error.message}`;
    }
}

async function sendFileByUrl(qq: string, fileUrl: string, type: 'audio' | 'video' | 'file'): Promise<string> {
    if (type === 'audio') {
        return await QQsendAudio(qq, fileUrl);
    } else {
        return await QQsendFile(qq, fileUrl);
    }
}

export async function output(runtime_data: { qq: string } | null, data: multi_contact_multimedia_message_array): Promise<void> {
    if (!runtime_data || !runtime_data.qq) {
        console.error('send_message_specific_qq: runtime_data 中缺少 qq');
        return;
    }

    const targetQq = runtime_data.qq;
    let fileIndex = 0;

    for (const msg of data.messages) {
        for (const part of msg.parts) {
            if (part.type === 'text' && part.content) {
                const result = await QQsendMessage(targetQq, part.content);
                console.log(`[send_message_specific_qq] 文本发送到 ${targetQq}: ${result}`);
            } else if (part.type === 'image') {
                if (part.inline) {
                    const result = await sendInlineImage(targetQq, part.inline, fileIndex++);
                    console.log(`[send_message_specific_qq] 图片发送到 ${targetQq}: ${result}`);
                } else if (part.file_url) {
                    const result = await sendFileByUrl(targetQq, part.file_url, 'file');
                    console.log(`[send_message_specific_qq] 图片URL发送到 ${targetQq}: ${result}`);
                }
            } else if (part.type === 'audio') {
                if (part.inline) {
                    const result = await sendInlineFile(targetQq, part.inline, fileIndex++, 'audio');
                    console.log(`[send_message_specific_qq] 语音发送到 ${targetQq}: ${result}`);
                } else if (part.file_url) {
                    const result = await sendFileByUrl(targetQq, part.file_url, 'audio');
                    console.log(`[send_message_specific_qq] 语音URL发送到 ${targetQq}: ${result}`);
                }
            } else if (part.type === 'video') {
                if (part.inline) {
                    const result = await sendInlineFile(targetQq, part.inline, fileIndex++, 'video');
                    console.log(`[send_message_specific_qq] 视频发送到 ${targetQq}: ${result}`);
                } else if (part.file_url) {
                    const result = await sendFileByUrl(targetQq, part.file_url, 'video');
                    console.log(`[send_message_specific_qq] 视频URL发送到 ${targetQq}: ${result}`);
                }
            } else if (part.type === 'file') {
                if (part.inline) {
                    const result = await sendInlineFile(targetQq, part.inline, fileIndex++, 'file');
                    console.log(`[send_message_specific_qq] 文件发送到 ${targetQq}: ${result}`);
                } else if (part.file_url) {
                    const result = await sendFileByUrl(targetQq, part.file_url, 'file');
                    console.log(`[send_message_specific_qq] 文件URL发送到 ${targetQq}: ${result}`);
                }
            }
        }
    }
}

export function get_type(): string {
    return "multi_contact_multimedia_message_array";
}

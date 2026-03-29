import { input_for_uid } from '../pipe';
import { multi_contact_multimedia_message_array, multimedia_message } from '../../../types/process/process.type';
import path from 'path';

const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.wav', '.mp3', '.amr', '.silk', '.ogg', '.m4a'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv'];

function getFileType(ext: string): 'image' | 'audio' | 'video' | 'file' {
    const lowerExt = ext.toLowerCase();
    if (SUPPORTED_IMAGE_EXTENSIONS.includes(lowerExt)) return 'image';
    if (SUPPORTED_AUDIO_EXTENSIONS.includes(lowerExt)) return 'audio';
    if (SUPPORTED_VIDEO_EXTENSIONS.includes(lowerExt)) return 'video';
    return 'file';
}

function parseStringToParts(input: string): multimedia_message[] {
    const parts: multimedia_message[] = [];
    const segments = input.split('@br');

    for (const segment of segments) {
        if (!segment || segment.trim() === '') continue;

        const fileMatch = segment.match(/^%\[(.+)\]$/);

        if (fileMatch) {
            const filePath = fileMatch[1];
            const ext = path.extname(filePath).toLowerCase();
            const fileType = getFileType(ext);
            const fileName = path.basename(filePath);

            if (fileType === 'image') {
                parts.push({
                    type: 'image',
                    content: '[图片]',
                    file_url: `file:///${filePath.replace(/\\/g, '/')}`
                });
            } else if (fileType === 'audio') {
                parts.push({
                    type: 'audio',
                    content: '[语音]',
                    file_url: `file:///${filePath.replace(/\\/g, '/')}`
                });
            } else if (fileType === 'video') {
                parts.push({
                    type: 'video',
                    content: '[视频]',
                    file_url: `file:///${filePath.replace(/\\/g, '/')}`
                });
            } else {
                parts.push({
                    type: 'file',
                    content: fileName,
                    file_url: `file:///${filePath.replace(/\\/g, '/')}`
                });
            }
        } else {
            parts.push({
                type: 'text',
                content: segment
            });
        }
    }

    return parts;
}

export function get_interface_type() {
    return {
        input_type: "string",
        output_type: "multi_contact_multimedia_message_array"
    }
}

export async function output(
    input: string,
    runtime_data: any,
    output_uid: string,
    output_type: string
): Promise<void> {
    if (!input || input.trim() === '') {
        return;
    }

    const parts = parseStringToParts(input);

    if (parts.length === 0) {
        return;
    }

    const result: multi_contact_multimedia_message_array = {
        messages: [{
            id: '',
            name: '',
            parts: parts
        }]
    };

    await input_for_uid(output_uid, result, output_type);
}

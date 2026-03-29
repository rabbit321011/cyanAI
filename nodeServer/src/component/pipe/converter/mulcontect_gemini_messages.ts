import { input_for_uid } from '../pipe';
import { multi_contact_multimedia_message_array, multimedia_message, standard_message_pack, QueueMessageInput } from '../../../types/process/process.type';

export function get_interface_type() {
    return {
        input_type: "multi_contact_multimedia_message_array",
        output_type: "standard_message_pack"
    }
}

function convertPartToItem(part: multimedia_message, id: string, name: string): QueueMessageInput {
    const userName = `${name}(${id})`;
    
    if (part.type === 'text') {
        return {
            send_curr: part.content,
            user_name: userName,
            files: [],
            inlines: []
        };
    } else if (part.type === 'image') {
        return {
            send_curr: '[图片]',
            user_name: userName,
            files: [],
            inlines: part.inline ? [part.inline] : []
        };
    } else if (part.type === 'audio') {
        return {
            send_curr: '[语音]',
            user_name: userName,
            files: [],
            inlines: part.inline ? [part.inline] : []
        };
    } else if (part.type === 'video') {
        return {
            send_curr: '[视频]',
            user_name: userName,
            files: [],
            inlines: part.inline ? [part.inline] : []
        };
    } else if (part.type === 'file') {
        return {
            send_curr: part.content,
            user_name: userName,
            files: [],
            inlines: part.inline ? [part.inline] : []
        };
    }
    
    return {
        send_curr: '',
        user_name: userName,
        files: [],
        inlines: []
    };
}

export async function output(
    input: multi_contact_multimedia_message_array,
    runtime_data: any,
    output_uid: string,
    output_type: string
): Promise<void> {
    const items: QueueMessageInput[] = [];
    
    for (const msg of input.messages) {
        for (const part of msg.parts) {
            const item = convertPartToItem(part, msg.id, msg.name);
            if (item.send_curr || item.inlines.length > 0 || item.files.length > 0) {
                items.push(item);
            }
        }
    }
    
    if (items.length > 0) {
        const result: standard_message_pack = { items };
        await input_for_uid(output_uid, result, output_type);
    }
}

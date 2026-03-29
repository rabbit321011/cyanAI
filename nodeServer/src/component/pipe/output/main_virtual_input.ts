import { autoAddMessage } from '../../process/main_virtual';
import { standard_message_pack } from '../../../types/process/process.type';

export function get_type(): string {
    return "standard_message_pack"
}

export async function output(runtime_data: any, data: standard_message_pack): Promise<void> {
    autoAddMessage(data);
}

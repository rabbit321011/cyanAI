import { autoAddDirectlyMessage } from '../../process/main_virtual';
import { standard_message_pack } from '../../../types/process/process.type';

export async function output(runtime_data: any, data: standard_message_pack): Promise<void> {
    autoAddDirectlyMessage(data);
}

export function get_type(): string {
    return "standard_message_pack";
}

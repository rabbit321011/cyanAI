import { input_for_uid } from '../pipe';
import { multi_contact_multimedia_message_array } from '../../../types/process/process.type';

export function get_interface_type() {
    return {
        input_type: "multi_contact_multimedia_message_array",
        output_type: "multi_contact_multimedia_message_array"
    }
}

export async function output(
    input: multi_contact_multimedia_message_array,
    runtime_data: { id: string } | null,
    output_uid: string,
    output_type: string
): Promise<void> {
    if (!runtime_data || !runtime_data.id) {
        return;
    }

    const targetId = runtime_data.id;
    const filteredMessages = input.messages.filter(msg => msg.id === targetId);

    if (filteredMessages.length === 0) {
        return;
    }

    const result: multi_contact_multimedia_message_array = {
        messages: filteredMessages
    };

    await input_for_uid(output_uid, result, output_type);
}

import { creat_converter, creat_pipe, creat_output } from '../../component/pipe/pipe';

export async function run_dynamic_pipe_node(){
    const idFilterUid = await creat_converter({ id: "2926855205" }, "id_filter", "id_filter_in", "id_filter_out");
    console.log(`注册了converter: id_filter, input_uid: ${idFilterUid?.input_uid}, output_uid: ${idFilterUid?.output_uid}`);
    
    const commandConverterUid = await creat_converter(null, "command_multi_contact_multimedia_message", "main_command_converter_in", "main_command_converter_out");
    console.log(`注册了converter: command_multi_contact_multimedia_message, input_uid: ${commandConverterUid?.input_uid}, output_uid: ${commandConverterUid?.output_uid}`);
    
    const geminiConverterUid = await creat_converter(null, "mulcontect_gemini_messages", "mulcontect_gemini_in", "mulcontect_gemini_out");
    console.log(`注册了converter: mulcontect_gemini_messages, input_uid: ${geminiConverterUid?.input_uid}, output_uid: ${geminiConverterUid?.output_uid}`);
    
    const stringToMultiContactUid = await creat_converter(null, "string_to_multi_contact_multimedia_message_array", "string_to_multi_contact_in", "string_to_multi_contact_out");
    console.log(`注册了converter: string_to_multi_contact_multimedia_message_array, input_uid: ${stringToMultiContactUid?.input_uid}, output_uid: ${stringToMultiContactUid?.output_uid}`);

    const sendMessageUid = await creat_output({ qq: "2926855205" }, "send_message_specific_qq");
    console.log(`注册了output: send_message_specific_qq, uid: ${sendMessageUid}`);

    const pipe1Result = creat_pipe("main_qq_messages", "id_filter_in");
    console.log(`注册了pipe: main_qq_messages -> id_filter_in, 结果: ${pipe1Result}`);
    
    const pipe2Result = creat_pipe("id_filter_out", "main_command_converter_in");
    console.log(`注册了pipe: id_filter_out -> main_command_converter_in, 结果: ${pipe2Result}`);
    
    const pipe3Result = creat_pipe("main_command_converter_out", "mulcontect_gemini_in");
    console.log(`注册了pipe: main_command_converter_out -> mulcontect_gemini_in, 结果: ${pipe3Result}`);
    
    const pipe4Result = creat_pipe("mulcontect_gemini_out", "directly_call_cyanAI");
    console.log(`注册了pipe: mulcontect_gemini_out -> directly_call_cyanAI, 结果: ${pipe4Result}`);
    
    const pipe5Result = creat_pipe("main_virtual_final_output", "string_to_multi_contact_in");
    console.log(`注册了pipe: main_virtual_final_output -> string_to_multi_contact_in, 结果: ${pipe5Result}`);
    
    const pipe6Result = creat_pipe("string_to_multi_contact_out", sendMessageUid);
    console.log(`注册了pipe: string_to_multi_contact_out -> ${sendMessageUid}, 结果: ${pipe6Result}`);
}
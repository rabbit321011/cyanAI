import { creat_converter, creat_pipe } from '../../component/pipe/pipe';

export async function run_dynamic_pipe_node(){
    await creat_converter(null,"command_multi_contact_multimedia_message","main_command_converter_in","main_command_converter_out");
    await creat_converter(null,"mulcontect_gemini_messages","mulcontect_gemini_in","mulcontect_gemini_out");
    
    creat_pipe("main_qq_messages", "main_command_converter_in");
    creat_pipe("main_command_converter_out", "mulcontect_gemini_in");
    creat_pipe("mulcontect_gemini_out", "main_virtual_input");
    creat_pipe("main_virtual_final_output", "example");
}

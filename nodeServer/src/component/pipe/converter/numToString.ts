
import { input_for_uid } from '../pipe';

export function get_interface_type(){
    return {
        input_type:"number",
        output_type:"string"
    }
}
export async function output(input:number, runtime_data:any, output_uid:string, output_type:string):Promise<void>{
    const result = input.toString();
    await input_for_uid(output_uid, result, output_type);
}
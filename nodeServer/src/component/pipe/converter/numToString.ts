
export function get_interface_type(){
    return {
        input_type:"number",
        output_type:"string"
    }
}
export function output(input:number,runtime_data:any):string{
    return input.toString();
}
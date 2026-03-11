//本文件存储转换消息类型的函数
import { TextMessage, Message } from "../../types/process/process.type";
export function openAI_cast_message(input:Message):TextMessage//将google的上下文message转换为openAI的上下文message
{
    let output:TextMessage = {
        text:"",
        role:"ERROR:不存在的role_type(openAI_cast_message)"
    }
    output.text = input.current;
    // 注意：functionCall 由 model 发出，functionResponse 由 user 发出
    // 所以这里不需要处理 "function" 类型，因为 role_type 只有 "user" 和 "model"
    if(input.role_type === "user")
    {
        output.role = "user"
    }else if(input.role_type === "model")
    {
        output.role = "assistant"
    }
    return output
}//只会保留current,role_type,其他的都会消失
export function openAI_cast_array(input:Message[]):TextMessage[]
{
    let output:TextMessage[] = []
    input.map((curr)=>{
        output.push(openAI_cast_message(curr))
    })
    return output
}

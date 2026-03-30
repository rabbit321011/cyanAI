import { main_status } from "../../component/process/main_virtual";
export function get_system_prompt()
{
    let system_temp_prompt = "";
    system_temp_prompt += main_status.system.main_prompt + "\n";
    system_temp_prompt += main_status.system.character_reference + "\n";
    system_temp_prompt += "^system 以下是你可以记起来的事(事件区):\n" + main_status.system.events  + "\n";
    system_temp_prompt += "^system 以下是你的工作区: \n" 
    main_status.system.workspace.map((curr)=>{
        system_temp_prompt += curr.index + ":" + curr.current + "\n";
    })
    system_temp_prompt += "^system 以下是在对话中涉及到的对象的信息(对象区) \n"
    //main_status.system.object_network
    //对象的重排序有点复杂，先不搞
    system_temp_prompt += "^system 以下是拉取到的信息: \n"
    main_status.system.pulled_info.map((curr)=>{
        system_temp_prompt += curr.index + ":" + curr.current + "\n"
    })
    system_temp_prompt += "^system 以下是你的计划链表: \n"
    main_status.system.step_progress.map((curr)=>{
        system_temp_prompt += curr.index + ":"  + curr.status + ":" + curr.current +"\n";
    })
    return system_temp_prompt;
}
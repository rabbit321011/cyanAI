import { routeOutput } from "../../types/process/process.type";
import { finish_event ,get_busy} from "../process/main_virtual";
export function runCommand(input:string):routeOutput
{
    if (input.startsWith("^command ")) {
        const command = input.slice(9);
        if(command.startsWith("new"))
            if(!get_busy())
            {
                console.log("正在准备结束事件")
                finish_event()
            }
            else
                console.log("繁忙中，请重试")
        return {
            stop:true,
            datas:command
        }
    } else {
        return {
            stop: false,
            datas: input
        };
    }
}
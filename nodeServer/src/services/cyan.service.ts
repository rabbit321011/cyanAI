import { exit_status,sendUserMessage,finish_event } from "../component/process/main_virtual";
//import {  } from "../types/web/web.type";
import { isError } from "../utility/error_out/error_out";
export class CyanMainService{
  //这个类负责把将各个网络的请求放到main-virtual的线程执行,其中的函数都是异步的
  async service_exit_status():Promise<boolean>{
    console.log("正在检测main_virtual的状态是否存在");
    return exit_status();
  }
  async service_send_message(current:string,userName:string):Promise<string>{
    console.log("正在发送消息...");
    return await sendUserMessage(current,userName);
  }
  async service_close_event():Promise<boolean>{
    console.log("正在总结事件")
    return (!isError(await finish_event()));
  }
}
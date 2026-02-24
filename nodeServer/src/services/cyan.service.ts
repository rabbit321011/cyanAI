import { exit_status,sendUserMessage } from "../component/process/main_virtual";
//import {  } from "../types/web/web.type";
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
}
import { exit_status,sendUserMessage,finish_event } from "../component/process/main_virtual";
//import {  } from "../types/web/web.type";
import { isError } from "../utility/error_out/error_out";
import * as fs from 'fs';
import * as path from 'path';
import { path_to_base64 } from "../component/escaper/path_to_base64";
export class CyanMainService{
  //这个类负责把将各个网络的请求放到main-virtual的线程执行,其中的函数都是异步的
  async service_exit_status():Promise<boolean>{
    console.log("正在检测main_virtual的状态是否存在");
    return exit_status();
  }
  async service_send_message(current:string,userName:string):Promise<string>{
    console.log("正在发送消息...");
    return path_to_base64(await sendUserMessage(current,userName));
  }
  async service_close_event():Promise<boolean>{
    console.log("正在总结事件")
    return (!isError(await finish_event()));
  }
  async service_send_test_message(current:string,userName:string):Promise<string>{
    console.log("正在发送测试消息...");
    const filePath = path.join(__dirname, '../../test/test_datas/test_message_text.txt');
    console.log('测试文件路径:', filePath);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      //console.log('文件内容:', content);
      // 使用path_to_base64函数处理内容
      const processedContent = path_to_base64(content);
      //console.log('处理后内容:', processedContent);
      return processedContent;
    } catch (error) {
      console.error('读取测试文件时出错:', error);
      return 'ERROR:读取测试文件失败: ' + String(error);
    }
  }
}
import { exit_status,sendUserMessage,finish_event } from "../component/process/main_virtual";
//import {  } from "../types/web/web.type";
import { isError } from "../utility/error_out/error_out";
import * as fs from 'fs';
import * as path from 'path';
import { path_to_base64 } from "../component/escaper/path_to_base64";
import { readIni } from "../utility/file_operation/read_ini";
import { writeIni } from "../utility/file_operation/write_ini";
import { getEquivalentBalance } from "../utility/usage/usage_meter";

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10分钟缓存

async function getCachedEquivalentBalance(iniPath: string): Promise<number> {
    const now = Date.now();
    const lastCheckTime = parseInt(readIni(iniPath, 'last_balance_check_time') || '0');
    const cachedBalance = parseFloat(readIni(iniPath, 'cached_equivalent_balance') || '0');

    if (now - lastCheckTime > CACHE_DURATION_MS || cachedBalance === 0) {
        const newBalance = await getEquivalentBalance();
        writeIni(iniPath, 'last_balance_check_time', now.toString());
        writeIni(iniPath, 'cached_equivalent_balance', newBalance.toString());
        console.log(`余额已更新: ${newBalance}`);
        return newBalance;
    }

    console.log(`使用缓存余额: ${cachedBalance}`);
    return cachedBalance;
}
export class CyanMainService{
  //这个类负责把将各个网络的请求放到main-virtual的线程执行,其中的函数都是异步的
  async service_exit_status():Promise<boolean>{
    console.log("正在检测main_virtual的状态是否存在");
    return exit_status();
  }
  async service_send_message(current:string,userName:string):Promise<string>{
    console.log("正在发送消息...");
    const iniPath = path.join(__dirname, '../../library_source.ini');
    const stopThreshold = parseFloat(readIni(iniPath, 'stop_threshold'));
    const equivalentBalance = await getCachedEquivalentBalance(iniPath);
    console.log("当前余额:"+equivalentBalance.toString())
    if (equivalentBalance < stopThreshold) {
      return "ERROR:余额不足";
    }
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
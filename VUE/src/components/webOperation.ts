import type {MessageItem} from './types/types'
// 从全局状态管理文件导入 globalState 对象
import {globalState} from './store/globalState'

export function creatUserMessage(curr:string):MessageItem{
    return {
      icon: '/img/header/user.jpg',
      current: curr,
      speaker: globalState.userName,
      currentFrom: 'raw'
    }
}
export function commandMessage(input:string):string//如果input是一个被成功执行的命令那么就返回"SUCCESS:这里是命令执行结果"，否则返回"ERROR:报错原因"
{
    if(input.startsWith('^command '))
    {
        input = input.slice(9);//去掉^command 
        if(input.startsWith('setname '))
        {
            input = input.slice(8);
            //余下的就是应该设置的name
            // 修改 globalState 对象的 userName 属性
            globalState.userName = input;
            return "SUCCESS:成功执行了设置用户名"
        }else if(input.startsWith('new'))
        {
            newChat();
            return "SUCCESS:成功清空了对话"
        }
        //else if(input.startsWith(''))
        return "SUCCESS:没有执行任何命令"
    }else
        return "ERROR:这不是命令";
}
export async function sendMessage(input:string):Promise<string>
{
    //调用聊天api，返回回复的字符串
    try {
        // 确保路径格式正确，避免斜杠重复
        const apiUrl = `${globalState.backendApiBaseUrl.replace(/\/$/, '')}/api/cyan/send`;
        console.log(`发送消息到: ${apiUrl}`);
        console.log(`消息内容: ${input}`);
        console.log(`用户名: ${globalState.userName}`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current: input,
                user_name: globalState.userName
            })
        });

        console.log(`响应状态码: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log(`响应数据:`, data);
        return data.result;
    } catch (error) {
        console.error('发送消息失败:', error);
        return `ERROR:发送消息时出错:${(error as Error).message}`;
    }
}

/**
 * 开始新的对话
 * @description 清空 ContextShow 组件中的消息并调用后端的 closeEvent 接口
 * @returns Promise<boolean> - 返回是否成功结束当前事件
 */
export async function newChat():Promise<boolean>
{
    try {
        // 确保路径格式正确，避免斜杠重复
        const apiUrl = `${globalState.backendApiBaseUrl.replace(/\/$/, '')}/api/cyan/closeEvent`;
        console.log(`结束当前事件: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`响应状态码: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        console.log(`响应数据:`, data);
        return data.result;
    } catch (error) {
        console.error('结束事件失败:', error);
        return false;
    }
}
import type {MessageItem} from './types/types'
// 从全局状态管理文件导入 userName
import {userName} from './store/globalState'

export function creatUserMessage(curr:string):MessageItem{
    return {
      icon: '/img/header/user.jpg',
      current: curr,
      speaker: userName,
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
            // 直接修改导入的 userName 变量（注意：这会修改原始变量，因为它们指向同一个内存地址）
            (userName as string) = input;
            return "SUCCESS:成功执行了设置用户名"
        }//else if(input.startsWith(''))
        return "SUCCESS:没有执行任何命令"
    }else
        return "ERROR:这不是命令";
}
export async function sendMessage(input:string):Promise<string>
{
    //调用聊天api，返回回复的字符串
    try {
        const response = await fetch('http://localhost:3000/api/cyan/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current: input,
                user_name: userName
            })
        });

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error('发送消息失败:', error);
        return `ERROR:发送消息时出错:${(error as Error).message}`;
    }
}
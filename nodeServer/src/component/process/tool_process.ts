//这玩意也是维护一个进程的状态，但是和main_virtual不同，这玩意维护的是tool进程的玩意
//由于tool进程是非常易失的，所以这玩意的一些实践和main_virtual.ts有些不同，而且tool_process.ts可能被同时调用
//tool_process.ts的一切函数都需要完整的输入一个文件夹路径，这个文件夹决定了这是什么tool,怎么运行
//tool进程有两种运行模式:等待模式 和 子任务模式
/*
等待模式下,tool进程执行完以后，会返回执行的结果
在非等待模式下，会直接返回“tool进程已在运行，执行完成后会推送执行结果”，然后新建一个进程跑这个tool进程
目前只支持等待模式
*/
//tool进程有三种初始化上下文模式，全载入上下文，半载入上下文，不载入上下文
/*
全载入上下文是指把包括系统提示词啥的都输入给tool进程，这需要传入一个Message数组和一个系统提示词文本
如果是deepseek作为tool模型，那么需要转换后传入TextMessage数组

半载入上下文是只把对话输入给tool进程，这需要输入一个Message/TextMessage数组
然后在最后再加一条系统消息，来切换到tool的工作模式

不载入上下文啥也不用输入
*/
/*
tool进程的初始化基于tool类型文件夹，tool类型文件夹在E:\MyProject\cyanAI\nodeServer\src\component\tools下
tool文件夹应该有以下内容:
config.ini文件:注明应该使用的配置
    其中的model_type项是"deepseek"或"gemini"//目前只支持deepseek类型
    其中的model_name项是使用的模型名字
    其中的context_mode项是"full","half","pure"三者之一
    其中的max_turns项是一个数字，表示最多允许模型运行几回，超过这个回数会强制模型返回结果或者失败
prompt.txt文件:这个文件会在最开始给模型作为系统提示词
break_prompt.txt文件:如果轮次超过了max_turns,那么就给模型输入这个文件
function.json文件:这个文件是一个JSON对象数组，是发给模型的function列表
    格式如下:
    [{
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "获取指定城市的当前天气",
        "parameters": {
          "type": "object",
          "properties": {
            "city": {"type": "string", "description": "城市名称，如：杭州"}
          },
          "required": ["city"]
        }
      }
    }]
functionServer文件夹:这个文件夹下的文件负责处理functionCall的返回，其为
    function名.ts
        在ts文件中,必然暴露出execute函数，这个函数接受之前提到的parameter描述的对象
    第二个function名.ts
    ...
    当然，一定有个exit.ts作为tool退出的出口，虽然其不实际存在，会在tool_process.ts就拦截tool的退出
    还带一个init接口,这个接口不会暴露给tool进程的AI,但是init.ts会在最开始执行一遍
    实际上必须暴露给tool进程的AI的接口也就exit
    如果有个type_def.ts,其会和init.ts一样被忽视
接受到functionCall的返回时自动将其对接到响应名字的ts文件，然后把返回值塞进functionCall的回答里面
auto_reply.txt
tool进程是没有输入的，所以如果模型不输出，需要调用auto_reply.txt给模型
upload文件夹，这个文件夹下是该tool的返回值的存储空间,一个tool在被调用的时候，就会在这个文件夹创建一个基于当前时间的文件名的json文件
    upload文件夹下的文件路径是一个tool进程绑定一个
    会读取json对象里的key为result的string值，其他的会忽视
*/
/*
tool进程运行始终在一个async函数里面，所以是没有.status文件的，状态就存在函数内状态
结果提交在core_datas/tool_responses
*/
import path from 'path'
import fs, { read } from 'fs'
import { readIni } from '../../utility/file_operation/read_ini'
import { Message, callDeepSeekLLM, DeepSeekRequest } from '../../utility/LLM_call/deepseek_call'
import { get_id } from '../../utility/time/get_id'
export async function excuteTool(tool_name:string,requirement:string,wait_mode:boolean = true):Promise<string>
{
    if(wait_mode)
    {
        //等待模式
        //通过tool_name在src\component\tools文件夹里看看有没有叫这个的
        const tool_file = path.join(__dirname,'../tools/',tool_name)
        if(fs.existsSync(tool_file))
        {
            //文件夹存在，开始
            //先核验文件夹什么的有没有错误
            if(!fs.existsSync(path.join(tool_file,'/config.ini')))
                return `工具${tool_name}缺失了文件config.ini`
            if(!fs.existsSync(path.join(tool_file,'/prompt.txt')))
                return `工具${tool_name}缺失了文件prompt.txt`
            if(!fs.existsSync(path.join(tool_file,'/break_prompt.txt')))
                return `工具${tool_name}缺失了文件break_prompt.txt`
            if(!fs.existsSync(path.join(tool_file,'/function.json')))
                return `工具${tool_name}缺失了文件function.json`
            if(!fs.existsSync(path.join(tool_file,'/functionServer')))
                return `工具${tool_name}缺失了文件夹functionServer`
            if(!fs.existsSync(path.join(tool_file,'/auto_reply.txt')))
                return `工具${tool_name}缺失了文件auto_reply.txt`
            if(!fs.existsSync(path.join(tool_file,'/upload')))
                return `工具${tool_name}缺失了文件夹upload`
            //读取config.ini,来获取设置当前tool进程的状态
            const model_type = readIni(path.join(tool_file,'/config.ini'),'model_type')
            if(model_type !== 'deepseek')
                return `模型${model_type}暂不支持！`
            const model_name = readIni(path.join(tool_file,'/config.ini'),'model_name')
            const context_mode = readIni(path.join(tool_file,'/config.ini'),'context_mode')
            const max_turns = parseInt(readIni(path.join(tool_file,'/config.ini'),'max_turns'))
            if(context_mode !== "pure")
                return "该上下文继承模式暂不支持"
            //初始化文件
            const status_file = path.join(tool_file,'/upload/',get_id()+".upload")
            fs.writeFileSync(status_file, '')
            //初始化上下文
            let tool_context:Message[] = []
            tool_context.push({
                content:fs.readFileSync(path.join(tool_file,'/prompt.txt'),'utf-8'),
                role:'system'
            })
            tool_context.push({
                content:requirement,
                role:'system'
            })
            const api_key = readIni(path.join(__dirname,'../../../library_source.ini'),'deepseek_api_sky')
            const function_json_content = fs.readFileSync(path.join(tool_file,'/function.json'),'utf-8')
            const tools = JSON.parse(function_json_content)
            tools.push(JSON.parse(fs.readFileSync(path.join(__dirname,'../tools/exit.json'),'utf-8')))
            let request:DeepSeekRequest = {
                messages:tool_context,
                tools:tools
            }
            let result = "ERROR:似乎没有正常更新执行状态"
            let now_turns = 0
            while(true)
            {
                if(now_turns === max_turns - 1)
                {
                    request.messages.push({
                        content:fs.readFileSync(path.join(tool_file,'/break_prompt.txt'),'utf-8'),
                        role:"system"
                    })
                }
                if(now_turns === max_turns)
                {
                    result = "ERROR:对话轮次超限"
                    break
                }
                now_turns++
                let response = await callDeepSeekLLM(request,api_key,model_name)
                console.log(response.text)
                //把收到的结果写到request的messages里
                if(response.functionCalls && response.functionCalls.length > 0)
                {
                    //如果有函数调用，添加包含tool_calls的assistant消息
                    request.messages.push({
                        role:'assistant',
                        content:null,
                        tool_calls:response.functionCalls.map((call) => ({
                            id: call.id || `call_${Math.random().toString(36).substr(2, 9)}`,
                            type: 'function' as const,
                            function: {
                                name: call.name,
                                arguments: JSON.stringify(call.args)
                            }
                        }))
                    })
                }else
                {
                    //如果没有函数调用，添加普通的assistant消息
                    request.messages.push({
                        content:response.text,
                        role:'assistant'
                    })
                }
                //检查函数调用
                if(response.functionCalls)
                for(let i = 0 ; i < response.functionCalls.length ; i++)
                {
                    //先检测是不是exit
                    if(response.functionCalls[i].name === 'exit')
                    {
                        console.log("tool进程退出了:"+ response.functionCalls[i].args.text)
                        result = JSON.parse(fs.readFileSync(status_file,'utf-8')).result
                        fs.unlinkSync(status_file)
                        return result
                    }
                    let now_functionCallTs = await import(path.join(tool_file,'/functionServer/',response.functionCalls[i].name))
                    let tool_result = await now_functionCallTs.execute(response.functionCalls[i].args,status_file)
                    //把函数执行结果加到聊天记录中
                    request.messages.push({
                        role:'tool',
                        content:JSON.stringify(tool_result),
                        tool_call_id: response.functionCalls[i].id || `call_${Math.random().toString(36).substr(2, 9)}`
                    })
                }
                else
                    request.messages.push({
                        content:fs.readFileSync(path.join(tool_file,'/auto_reply.txt'),'utf-8'),
                        role:"system"
                    })
            }
            //被跳出了
            fs.unlinkSync(status_file)
            return result
        }else
        {
            return `不存在名为${tool_name}的工具！`
        }
    }else
    {
        let task_id = get_id()
        //确保core_datas/tool_responses目录存在
        const tool_responses_dir = path.join(__dirname,'../../../core_datas/tool_responses')
        if(!fs.existsSync(tool_responses_dir))
        {
            fs.mkdirSync(tool_responses_dir,{recursive:true})
        }
        excuteTool(tool_name,requirement,true).then(
            (result)=>{
                //提交结果的函数
                const result_file = path.join(tool_responses_dir,`${task_id}.json`)
                fs.writeFileSync(result_file,JSON.stringify({result:result}))
                console.log(`工具执行完成，结果已保存到: ${result_file}`)
            }
        ).catch(
            (error)=>{
                console.error(`工具执行失败: ${error}`)
            }
        )
        return "该工具已经在执行。任务序号:" + task_id //,执行完成后你将会收到提醒
    }
}
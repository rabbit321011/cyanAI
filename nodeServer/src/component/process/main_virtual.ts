//-----------------这里是接口啥的的定义----------------------------------
import {inlineData,functionCall,functionResponse,Message,MemoryState,LinesP,EventOutputItem} from '../../types/process/process.type'
import {readIni} from '../../utility/file_operation/read_ini'
import {loadInitialEvents} from '../events/event_loader'
import {now} from '../../utility/time/cyan_time'
import fs from 'fs';
import path from 'path';
import { callGoogleLLM, EasyGeminiRequest } from '../../utility/LLM_call/google_call';
export interface workspace_ent{
    index:string,//以ws开头，然后是序号
    current:string//这里写着%[文件的完整路径]或者直接是文件内容
}
export interface object_ent_current{
    state:MemoryState,//这是记忆相关的
    /*
        R默认是1
        S默认20，这个值意味着比较中等的上下文压缩策略，10是比较激进，5是非常激进，50则能撑上百对话回合
        last_T_distance以对话(chat)轮次差为单位,虽然是字符串，但是里面只写了一个数字
        同一个chat内这些东西是不变的
        D:在用到时候设为 0，可能被用到的时候设为 0.7
        a:默认3，如果觉得记性不太好，则扩展到5,如果觉得记的太快了，则设置为2
    */
    last_time:number,//这里记录的是上次提起的轮次,以chat为单位
    text:string//记录实际的内容       
}
export interface object_ent
{
    name:string,
    current:object_ent_current[]
}
export interface relative_ent_current{
    state:MemoryState,
    last_time:number,
    text:string//这个和上面完全一样
}
export interface relative_ent{
    start:string,//表示关系的发起方
    target:string,//表示接受方
    current:relative_ent_current[]         
}
export interface pulled_ent{
    index:string,//以pi开头，然后是数字
    current:string//完整的文件路径，不加%[]
}
export interface step_ent{
    index:string,//以sp开头，然后是数字
    status:string,//可以是pending,processing,completed其中之一
    current:string//计划的内容
}
export interface total_status{
    system:{
        main_prompt:string,//静态的
        character_reference:string,//静态的
        events:string,//因为event基本不更新，所以当前版本锁为一个string就行，之后改
        workspace:workspace_ent[],
        object_network:{
        	objects:object_ent[],
            relative:relative_ent[]
        },
        pulled_info:pulled_ent[],
        step_progress:step_ent[],
    }
    context:Message[]//这个就直接是一个Message数组了
}
export interface content_unit{
    role:string,
    parts:part_unit[]
}
export interface part_unit {
  text?: string;
  inlineData?: { 
    mimeType: string; 
    data: string; 
  };
  fileData?: { 
    mimeType: string; 
    fileUri: string; 
  };
  functionCall?: { 
    name: string; 
    args: any; 
  };
  functionResponse?: { 
    name: string; 
    response: any; 
  };
  executableCode?: { 
    language: 'PYTHON' | string; 
    code: string; 
  };
  codeExecutionResult?: { 
    outcome: 'OUTCOME_OK' | 'OUTCOME_FAILED' | string; 
    output: string; 
  };
}

//-------------------------------这块是维护核心功能的---------------------------------------
//这个文件是最核心的文件，负责维护main-virtual
let main_status:total_status|null = null;
const default_status:total_status = {
    system:{
        main_prompt:"[等待载入...]",//静态的
        character_reference:"[等待载入...]",//静态的
        events:"[等待载入...]",//因为event基本不更新，所以当前版本锁为一个string就行，之后改
        workspace:[
        ],
        object_network:{
        	objects:[],
            relative:[]
        },
        pulled_info:[],
        step_progress:[]
    },
    context:[]//这个就直接是一个Message数组了
}
//以上变量都是核心的内容，但是本文件只是维护main-virtual的文件，故以上的变量不是持久化的，而是每次使用重新从core_data载入的
export function getCoreStateForFile():string//该函数会从core_datas/main_virtual/main_virtual.status中载入main-virtual的状态,返回执行的结果
{
    //清空状态变量
    main_status = null;
    //先检测存在文件吗？格式正确吗？
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    main_status = readStatusFromFile(statusPath);
    if(main_status !== null){
        //（认为该文件正确）存在,读取
        return "SUCCESS:成功读取";
    }else{
        //不存在，准备新建以后引入
        main_status = {...default_status};
        //开始引入
        //引入main_prompt
        main_status.system.main_prompt = readFileSyncAsString(readIni(path.join(__dirname,'../../../library_source.ini'),'main_prompt_file_1'))+ "\n";
        main_status.system.main_prompt += readFileSyncAsString(readIni(path.join(__dirname,'../../../library_source.ini'),'character_reference'))+ "\n";
        main_status.system.main_prompt += readFileSyncAsString(readIni(path.join(__dirname,'../../../library_source.ini'),'main_prompt_file_2'))+ "\n";
        main_status.system.character_reference = "";//现版本为空
        //然后载入事件string,使用component/events/event_loader.ts
        let events_temp_load:EventOutputItem[] = loadInitialEvents();
        //先把event排序一下
        events_temp_load.sort((a, b) => {
            const dateA = a.source.path.split(/[\\/]/).slice(-4, -1).join('');
            const dateB = b.source.path.split(/[\\/]/).slice(-4, -1).join('');
            return dateB.localeCompare(dateA);
        });
        
        //将event固化
        main_status.system.events = ""
        events_temp_load.forEach((input:EventOutputItem)=>{
            main_status!.system.events += input.source.path.split(/[\\/]/).slice(-4, -1).join('') + ':' + input.current + "\n";
        })
        //剩下的东西都不用载入，但是我觉得之后肯定得吧obj的载入啥的写一写
        //写入文件
        if(writeStatusToFile(statusPath,main_status))
            return "SUCCESS:新建了状态"
        else
            return "ERROR:新的状态文件写入失败"
    }
    return "ERROR:意外的结果？"
}
export function saveCoreStateForFile():string{
    if(main_status === null)
        return "ERROR:当前state是空的"
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    if(writeStatusToFile(statusPath,main_status))
        return "SUCCESS:成功写入"
    else
        return "ERROR:写入失败"
}
export function removeCoreStateForFile():string{
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    if(fs.existsSync(statusPath))
    {
        try{
            fs.unlinkSync(statusPath);
        }
        catch{
            return "ERROR:删除文件时报错";
        }
        main_status = null;
        return "SUCCESS:成功删除了文件";
    }
    else
        return "SUCCESS:该文件本来就不存在";
}
export function addMessage(addition:Message):string{
    try
    {
        main_status?.context.push(addition);
        return "SUCCESS";
    }
    catch
    {
        return "ERROR";
    }
}//如果main_status没有被初始化，那么函数将会没有效果
function readStatusFromFile(filePath: string): total_status | null {
  try {
    const fileContent: string = fs.readFileSync(filePath, 'utf-8');
    const statusObject: total_status = JSON.parse(fileContent);
    return statusObject;
  } catch (error) {
    console.error(`读取或解析文件时出错: ${filePath}`, error);
    // 根据需要处理错误，比如文件不存在、JSON格式错误等
    return null;
  }
}
function readFileSyncAsString(filePath: string): string {
    const fileContent: string = fs.readFileSync(filePath, 'utf-8');
    return fileContent;
}
/**
 * 同步地将一个 total_status 对象以JSON格式写入文件。
 * @param filePath 要写入的文件的路径。
 * @param statusObject 要写入文件的 total_status 对象。
 * @returns 如果写入成功，返回 true；否则返回 false。
 */
function writeStatusToFile(filePath: string, statusObject: total_status): boolean {
  try {
    // 1. 将对象转换为格式化的JSON字符串
    // JSON.stringify(value, replacer, space)
    // - 第一个参数是你的对象。
    // - 第二个参数 (null) 是一个替换器函数，这里我们不需要。
    // - 第三个参数 (2) 是缩进的空格数，这会让你的JSON文件更易读。
    const jsonString = JSON.stringify(statusObject, null, 2);

    // 2. 同步地将字符串写入文件
    // 如果文件已存在，其内容会被覆盖。如果不存在，会被创建。
    fs.writeFileSync(filePath, jsonString, 'utf-8');
    
    console.log(`成功将数据写入到文件: ${filePath}`);
    return true; // 表示成功

  } catch (error) {
    console.error(`写入JSON文件时出错: ${filePath}`, error);
    return false; // 表示失败
  }
}
//-----------------------------这里是进行进一步的功能的---------------------------------------
const default_Message = {
    current:"这是默认文本",
    role_type:"user",
    role:"default",
    time:"20240101_000000",
    file:[],
    inline:[],
    toolsCalls:[],
    toolsResponse:[]
}
export function addMessageFromString(addition:string,type:string = "user",name:string = "321哦啦啦",files:string[] = [],inlines:inlineData[] = []):string
{
        /*
        export interface Message {
        current:string;//这是原始的文本内容，是没有转义的,不带时间和发言人
        role_type:string;//这是发言人的类型,可以是function,user,或者model
        role:string;//这是发言者的名字,如果是role_type==function,这里为空
        time:string;//这是基于cyanTime的标准时间字符串，如果role_type==function,这里为空
        file:string[];//这是附带的文件,是一个数组，每个成员都是一个完整的文件路径，如果role_type==function,这里为空
        inline:inlineData[];//这是附带的内联文件，如果role_type==function,这里为空
        toolsCalls?:functionCall[];//这是做出的functionCall，如果role_type==function,这里为空
        toolsResponse?:functionResponse[];//这是回答的functionResponse，如果role_type!=function,这里为空
        } 
        */
    let temp_Message:Message = {...default_Message};
    temp_Message.time = now();
    temp_Message.role_type = type;
    temp_Message.role = name;
    temp_Message.file = files;
    temp_Message.inline = inlines;
    //其他玩意为空就行
    main_status?.context.push(temp_Message);
    return "SUCCESS:执行完成"
}//这个函数添加一个Message,接口比较完善
export async function sendAll(INtemperature:number = 0.7 , INmaxOutputTokens:number = 2000):Promise<string>
{
    if(verify_context() && main_status)
    {
        try{
            //先生成系统部分的提示词
            let system_temp_prompt = "";
            system_temp_prompt += main_status.system.main_prompt + "\n";
            system_temp_prompt += main_status.system.character_reference + "\n";
            system_temp_prompt += "^system 以下是你可以记起来的事：\n" + main_status.system.events  + "\n";
            system_temp_prompt += "^system 以下是你的工作区: \n" 
            main_status.system.workspace.map((curr)=>{
                system_temp_prompt += curr.index + ":" + curr.current + "\n";
            })
            //system_temp_prompt += "^system 以下是在对话中涉及到的对象的信息 \n"
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
            //系统提示词生成完成，载入对话记录
            let content_temp:content_unit[] = []
            main_status.context.map((curr)=>{
                //依次载入
                let temp_content_unit:content_unit = {
                    role:curr.role_type,
                    parts:[]
                }

                if(curr.current !== "")
                {   
                    let temp_text = "";
                    temp_text += '^' + curr.role + ':' + curr.time + ':' + curr.current;
                    temp_content_unit.parts.push({text:temp_text});
                }
                //if(curr.file.length !== 0)
                //curr.file[]附带的文件暂且忽略掉
                if(curr.inline.length !== 0)
                    curr.inline.map((inlineUnit)=>{
                        temp_content_unit.parts.push({inlineData:{mimeType:inlineUnit.mimeType,data:inlineUnit.data}});
                    })
                //curr.toolsCalls[]
                //curr.toolsResponse[]
                //工具这玩意咱们暂时先不写
                //然后把载入好的unit载入总集
                content_temp.push(temp_content_unit);
            })
            //载入完成
            const request:EasyGeminiRequest = {
                systemInstruction : system_temp_prompt,
                contents : content_temp,
                generationConfig:{
                    temperature:INtemperature,
                    maxOutputTokens:INmaxOutputTokens
                }
            }
            const response = await callGoogleLLM(
                request,
                readIni(path.join(__dirname,'../../../library_source.ini'),'google_api_key'),
                "gemini-3-pro-preview",
                readIni(path.join(__dirname,'../../../library_source.ini'),'google_base_url')
            )
            console.log(response.text);
            addMessageFromString(
                response.text,
                "model",
                "cyanAI"
            )
            return "SUCCESS:回复正常"
        }catch{
            return "ERROR:状态合法但是发生错误"
        }
        
    }
    return "ERROR:当前状态不合法"
}//这个函数发送当前的的上下文状态给模型
export function verify_context():boolean
{
//不能有连续的model,user,function,user后不可以接function,function后也不能是user
//第一条得是user
//最后一条只能是user或者function,不能是model
if(main_status)
{
    const temp_message_length= main_status.context.length
    if(main_status.context[0].role_type !== "user")
        return false;
    let temp_last_type = "user"
    for(let i = 1 ; i < temp_message_length; i++)
    {
        if(
            (temp_last_type === main_status.context[i].role_type) ||
            (
                temp_last_type === "user" && main_status.context[i].role_type === "function"
            )||
            (
                temp_last_type === "function" && main_status.context[i].role_type === "user"
            )
        )
        {
            //没问题
        }else
            return false;//校验不通过
        temp_last_type = main_status.context[i].role_type;
    }
    //单独校验一下最后一条
    if(main_status.context[temp_message_length - 1].role_type === "model")
        return false;
    return true;
}
else
    return false;//模型不存在
}//这个检查当前状态是否合法
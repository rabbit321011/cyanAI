//-----------------这里是接口啥的的定义----------------------------------
// #region imports
import {inlineData,functionCall,functionResponse,Message,MemoryState,LinesP,EventOutputItem,QueueMessageInput,standard_message_pack} from '../../types/process/process.type'
import {readIni} from '../../utility/file_operation/read_ini'
import {loadInitialEvents} from '../events/event_loader'
import {now, sub, compare} from '../../utility/time/cyan_time'
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { callGoogleLLM, EasyGeminiRequest, EasyGeminiResponse } from '../../utility/LLM_call/google_call';
import { callDeepSeekTemp } from '../../utility/temp/deepseek_call';
import { isError } from '../../utility/error_out/error_out';
import { remove_timestamp } from '../escaper/remove_timestamp';
import { saveEvent } from '../events/event_saver';
import { excuteTool } from './tool_process';
import { getApiKeyManager } from '../../utility/error_type/api_key_manager';
import { 
    creat_source,      // 创建数据源
    creat_output,      // 创建最终输出
    creat_pipe,        // 连接管道
    input_for_uid      // 向管道输入数据
} from '../pipe/pipe';
// #endregion

// #region interface
export interface workspace_ent{
    index:string,//以ws开头，然后是序号
    current:string//这里写着%[文件的完整路径]或者直接是文件内容
}
/** 工作区条目，表示AI可以访问的文件或内容 */
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
/** 对象条目，包含对象名称及其当前状态列表 */
export interface object_ent
{
    name:string,
    current:object_ent_current[]
}
/** 关系条目的当前状态，包含记忆状态、时间和文本内容 */
export interface relative_ent_current{
    state:MemoryState,
    last_time:number,
    text:string//这个和上面完全一样
}
/** 关系条目，表示两个对象之间的关系 */
export interface relative_ent{
    start:string,//表示关系的发起方
    target:string,//表示接受方
    current:relative_ent_current[]         
}
/** 拉取的信息条目，表示从外部获取的文件路径 */
export interface pulled_ent{
    index:string,//以pi开头，然后是数字
    current:string//完整的文件路径，不加%[]
}
/** 步骤进度条目，表示AI计划中的步骤 */
export interface step_ent{
    index:string,//以sp开头，然后是数字
    status:string,//可以是pending,processing,completed其中之一
    current:string//计划的内容
}
/** 整体状态，包含系统配置和对话上下文 */
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
/** 内容单元，用于构建LLM请求的消息结构 */
export interface content_unit{
    role:string,
    parts:part_unit[]
}
/** 消息部件单元，包含文本、图片、文件、函数调用等多种内容类型 */
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
  thoughtSignature?: string;
}
// #endregion
//-------------------------------这块是维护核心功能的---------------------------------------
// #region core_file
//这个文件是最核心的文件，负责维护main-virtual
let main_status:total_status|null = null;
let main_virtual_busy:boolean = false;
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
export function get_busy():boolean{
    return main_virtual_busy;
}//获取盲目状态
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
}//载入status文件
export function saveCoreStateForFile():string{
    if(main_status === null)
        return "ERROR:当前state是空的"
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    if(writeStatusToFile(statusPath,main_status))
        return "SUCCESS:成功写入"
    else
        return "ERROR:写入失败"
}//保存状态到文件
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
}//删除文件
export function getMainStatus():total_status|null{
    if (main_status === null) {
        getCoreStateForFile();
    }
    return main_status;
}//获取主状态（貌似没用？)
export function reloadMainStatus():string{
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    if(fs.existsSync(statusPath))
    {
        try{
            fs.unlinkSync(statusPath);
        }
        catch{
            return "ERROR:删除文件时报错";
        }
    }
    main_status = null;
    return "SUCCESS:已重载，main_status已清空";
}//清空main_status变量和文件
function addMessage(addition:Message):string{
    try
    {
        main_status?.context.push(addition);
        return "SUCCESS";
    }
    catch
    {
        return "ERROR";
    }
}//如果main_status没有被初始化，那么函数将会没有效果。直接置入一个message对象
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
}//从文件取得status
function readFileSyncAsString(filePath: string): string {
    const fileContent: string = fs.readFileSync(filePath, 'utf-8');
    return fileContent;
}//输入文件路径，删除
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
}//把status写入文件
// #endregion
//-----------------------------这里是工具啥的---------------------------------------
export function verify_chatable():boolean
{
//判断是否可以执行sendAll
//最后一条消息的role_type必须是user
//注意：functionCall 由 model 发出，functionResponse 由 user 发出
if(main_status && (main_status.context.length !== 0 ))
{
    const last_role_type = main_status.context[main_status.context.length - 1].role_type;
    return last_role_type === "user";
}
return false;
}//判断是否可以发送消息（判断最后一条是不是user，其实已经过时了
async function summarizeImage(imageData: inlineData): Promise<string> {
    const request: EasyGeminiRequest = {
        contents: [{
            role: 'user',
            parts: [
                { text: '请描述这张图片的内容。如果图片中包含文档或文字，请完整列出所有可见的文字；如果是普通图片，请详细描述画面内容、人物、场景、色彩等，尽量100字以内。格式：直接输出描述内容，不要加任何前缀。' },
                { inlineData: { mimeType: imageData.mimeType, data: imageData.data } }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
        }
    };
    
    try {
        const response = await callGoogleLLM(
            request,
            readIni(path.join(__dirname, '../../../library_source.ini'), 'google_api_key'),
            "gemini-2.5-flash",
            readIni(path.join(__dirname, '../../../library_source.ini'), 'google_base_url')
        );
        return response.text || '[图片内容无法识别]';
    } catch (error) {
        console.error('图片总结失败:', error);
        return '[图片内容无法识别]';
    }
}//总结图片内容
async function processImageSummaries(): Promise<void> {
    if (!main_status) return;
    
    const currentTime = now();
    const expireTime = '10min'; // 10分钟过期
    const maxRecentImages = 7; // 最近7张图片不总结
    
    // 从后往前统计图片数量，标记哪些图片是"最近的"
    let recentImageCount = 0;
    const messageImageStatus: { index: number; isRecent: boolean; imageCount: number }[] = [];
    
    for (let i = main_status.context.length - 1; i >= 0; i--) {
        const msg = main_status.context[i];
        if (msg.inline && msg.inline.length > 0) {
            const imageCount = msg.inline.length;
            const isRecent = recentImageCount < maxRecentImages;
            messageImageStatus.unshift({ index: i, isRecent, imageCount });
            recentImageCount += imageCount;
        }
    }
    
    // 处理每条消息中的图片
    for (const status of messageImageStatus) {
        const msg = main_status.context[status.index];
        if (!msg.inline || msg.inline.length === 0) continue;
        
        // 检查时间是否过期
        const timeDiff = sub(currentTime, msg.time);
        const isExpired = compare(timeDiff, expireTime) >= 0;
        
        // 如果不是最近的图片或者已过期，需要总结
        if (!status.isRecent || isExpired) {
            // 总结每张图片
            const summaries: string[] = [];
            for (const img of msg.inline) {
                const summary = await summarizeImage(img);
                summaries.push(summary);
            }
            
            // 更新消息：移除图片，添加文本描述
            // 使用与其他消息相同的格式：^role:time:content
            const imageDescription = summaries.map((s, idx) => {
                const prefix = summaries.length === 1 ? '这张图片的内容是：' : `图片${idx + 1}的内容是：`;
                return `^${msg.role}:${msg.time}:${prefix}${s}`;
            }).join('\n');
            
            // 追加到 current 文本
            if (msg.current) {
                msg.current += '\n' + imageDescription;
            } else {
                msg.current = imageDescription;
            }
            
            // 清空 inline
            msg.inline = [];
            
            console.log(`已总结消息 ${status.index} 的 ${summaries.length} 张图片`);
        }
    }
    
    // 保存状态到文件，确保总结结果持久化
    if (messageImageStatus.length > 0) {
        const saveResult = saveCoreStateForFile();
        if (saveResult.startsWith("ERROR")) {
            console.error("保存图片总结结果失败:", saveResult);
        } else {
            console.log("图片总结结果已保存到文件");
        }
    }
}//总结该总结的图片到文本
export function verify_context():boolean
{
//不能有连续的model
//第一条得是user
//最后一条只能是user，不能是model或function
//支持多part：允许连续的user消息，它们会被合并到一个content_unit的parts中
if(main_status && (main_status.context.length !== 0 ))
{
    const temp_message_length= main_status.context.length
    if(main_status.context[0].role_type !== "user")
        return false;
    let temp_last_type = "user"
    for(let i = 1 ; i < temp_message_length; i++)
    {
        // 检查是否有连续的 model（functionCall 应该由 model 发出，但会被 user 的 functionResponse 跟随）
        if(temp_last_type === "model" && main_status.context[i].role_type === "model")
        {
            return false;//有问题
        }
        temp_last_type = main_status.context[i].role_type;
    }
    //单独校验一下最后一条
    // 最后一条必须是 user（包含 functionResponse）
    if(main_status.context[temp_message_length - 1].role_type !== "user")
        return false;
    return true;
}
else
    return false;//模型不存在
}//这个检查当前状态是否合法
//-----------------------------这里是进行上下文的功能的---------------------------------------
const default_Message = {
    current:"这是默认文本",
    role_type:"user",
    role:"default",
    time:"20240101_000000",
    file:[],
    inline:[],
    toolsCalls:[],
    toolsResponse:[]
}//默认文件
export function addMessageFromString(addition:string,type:string = "user",name:string = "321哦啦啦",files:string[] = [],inlines:inlineData[] = []):string
{
        /*
        export interface Message {
        current:string;//这是原始的文本内容，是没有转义的,不带时间和发言人
        role_type:string;//这是发言人的类型,可以是user,或者model
        role:string;//这是发言者的名字
        time:string;//这是基于cyanTime的标准时间字符串
        file:string[];//这是附带的文件,是一个数组，每个成员都是一个完整的文件路径
        inline:inlineData[];//这是附带的内联文件
        toolsCalls?:functionCall[];//这是做出的functionCall，只有model类型才有
        toolsResponse?:functionResponse[];//这是回答的functionResponse，只有user类型才有
        } 
        */
    let temp_Message:Message = {...default_Message};
    temp_Message.current = addition;
    temp_Message.time = now();
    temp_Message.role_type = type;
    temp_Message.role = name;
    temp_Message.file = files;
    temp_Message.inline = inlines;
    //其他玩意为空就行
    main_status?.context.push(temp_Message);
    return "SUCCESS:执行完成"
}//这个函数添加一个Message,接口比较完善

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_FILE_MIME_TYPES: { [key: string]: string } = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm'
};

type FileToInlineResult = 
    | { success: true; mimeType: string; data: string }
    | { success: false; reason: string };

function getMimeTypeFromUrl(url: string): string | null {
    const urlPath = url.split('?')[0];
    const ext = path.extname(urlPath).toLowerCase();
    if (ext && SUPPORTED_FILE_MIME_TYPES[ext]) {
        return SUPPORTED_FILE_MIME_TYPES[ext];
    }

    const urlObj = new URL(url);
    
    const orgfmt = urlObj.searchParams.get('orgfmt');
    const format = urlObj.searchParams.get('format');
    
    const formatMap: { [key: string]: string } = {
        't264': 'video/mp4',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'amr': 'audio/amr',
        'silk': 'audio/silk',
        'ogg': 'audio/ogg',
        'm4a': 'audio/mp4',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp'
    };
    
    if (orgfmt && formatMap[orgfmt.toLowerCase()]) {
        return formatMap[orgfmt.toLowerCase()];
    }
    
    if (format && formatMap[format.toLowerCase()]) {
        return formatMap[format.toLowerCase()];
    }

    return null;
}

async function fileToInlineData(filePathOrUrl: string): Promise<FileToInlineResult> {
    try {
        if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
            const mimeType = getMimeTypeFromUrl(filePathOrUrl);
            if (!mimeType) {
                return { success: false, reason: `文件类型不支持:${filePathOrUrl.substring(0, 50)}...` };
            }

            const response = await axios.get(filePathOrUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                maxContentLength: MAX_FILE_SIZE
            });

            const size = response.data.byteLength || response.data.length;
            if (size > MAX_FILE_SIZE) {
                const sizeMB = (size / 1024 / 1024).toFixed(2);
                return { success: false, reason: `文件大于10MB(${sizeMB}MB),不支持读取` };
            }

            const base64 = Buffer.from(response.data).toString('base64');
            return { success: true, mimeType, data: base64 };
        }

        const ext = path.extname(filePathOrUrl).toLowerCase();
        const mimeType = SUPPORTED_FILE_MIME_TYPES[ext];
        if (!mimeType) {
            return { success: false, reason: `文件类型不支持:${filePathOrUrl}` };
        }

        if (!fs.existsSync(filePathOrUrl)) {
            return { success: false, reason: `文件不存在:${filePathOrUrl}` };
        }

        const stats = fs.statSync(filePathOrUrl);
        if (stats.size > MAX_FILE_SIZE) {
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            return { success: false, reason: `文件大于10MB(${sizeMB}MB),不支持读取` };
        }

        const buffer = fs.readFileSync(filePathOrUrl);
        const base64 = buffer.toString('base64');

        return { success: true, mimeType, data: base64 };
    } catch (error) {
        console.error('fileToInlineData 错误:', error);
        return { success: false, reason: `文件读取错误` };
    }
}

export async function sendAll(INtemperature:number = 0.7 , INmaxOutputTokens:number = 2000):Promise<string>
{
    
    main_virtual_busy = true;
    if(verify_context() && verify_chatable() && main_status)
    {
        try{
            // 先处理图片总结
            await processImageSummaries();
            
            //先生成系统部分的提示词
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
            //系统提示词生成完成，载入对话记录
            let content_temp:content_unit[] = []
            let last_unit:content_unit|null = null
            
            for(const curr of main_status.context){
                //检查是否可以和上一条合并（相同role_type）
                if(last_unit && last_unit.role === curr.role_type) {
                    //合并到同一个content_unit的parts中
                    if(curr.current !== "")
                    {   
                        let temp_text = "";
                        temp_text += '^' + curr.role + ':' + curr.time + ':' + curr.current;
                        last_unit.parts.push({text:temp_text});
                    }
                    if(curr.inline.length !== 0)
                        curr.inline.map((inlineUnit)=>{
                            last_unit!.parts.push({inlineData:{mimeType:inlineUnit.mimeType,data:inlineUnit.data}});
                        })
                    if(curr.file.length !== 0) {
                        for(const filePath of curr.file) {
                            const result = await fileToInlineData(filePath);
                            if(result.success) {
                                last_unit!.parts.push({inlineData:{mimeType:result.mimeType,data:result.data}});
                            } else {
                                last_unit!.parts.push({text:`[${(result as { success: false; reason: string }).reason}]`});
                            }
                        }
                    }
                    // 处理工具调用（只有 model 类型的消息才有）
                    if(curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                        curr.toolsCalls.map((toolCall) => {
                            const part: any = {
                                functionCall: {
                                    name: `default_api:${toolCall.name}`,
                                    args: toolCall.args
                                }
                            };
                            if(toolCall.thoughtSignature) {
                                part.thoughtSignature = toolCall.thoughtSignature;
                            }
                            last_unit!.parts.push(part);
                        });
                    }
                    // 处理工具响应（只有 user 类型的消息才有）
                    if(curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                        curr.toolsResponse.map((toolResponse) => {
                            last_unit!.parts.push({functionResponse: {name: toolResponse.name, response: toolResponse.response}});
                        });
                    }
                } else {
                    //创建新的content_unit
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
                    if(curr.inline.length !== 0)
                        curr.inline.map((inlineUnit)=>{
                            temp_content_unit.parts.push({inlineData:{mimeType:inlineUnit.mimeType,data:inlineUnit.data}});
                        })
                    if(curr.file.length !== 0) {
                        for(const filePath of curr.file) {
                            const result = await fileToInlineData(filePath);
                            if(result.success) {
                                temp_content_unit.parts.push({inlineData:{mimeType:result.mimeType,data:result.data}});
                            } else {
                                temp_content_unit.parts.push({text:`[${(result as { success: false; reason: string }).reason}]`});
                            }
                        }
                    }
                    // 处理工具调用（只有 model 类型的消息才有）
                    if(curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                        curr.toolsCalls.map((toolCall) => {
                            const part: any = {
                                functionCall: {
                                    name: `default_api:${toolCall.name}`,
                                    args: toolCall.args
                                }
                            };
                            if(toolCall.thoughtSignature) {
                                part.thoughtSignature = toolCall.thoughtSignature;
                            }
                            temp_content_unit.parts.push(part);
                        });
                    }
                    // 处理工具响应（只有 user 类型的消息才有）
                    if(curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                        curr.toolsResponse.map((toolResponse) => {
                            temp_content_unit.parts.push({functionResponse: {name: toolResponse.name, response: toolResponse.response}});
                        });
                    }
                    
                    content_temp.push(temp_content_unit);
                    last_unit = temp_content_unit;
                }
            }
            //载入完成
            // 从 main.json 读取 tools 配置
            let toolsConfig = [];
            try {
                const toolsPath = path.join(__dirname, '../erogenous_zone/main_virtual/main.json');
                if (fs.existsSync(toolsPath)) {
                    const toolsContent = fs.readFileSync(toolsPath, 'utf-8');
                    toolsConfig = JSON.parse(toolsContent);
                }
            } catch (error) {
                console.error('读取 tools 配置失败:', error);
                toolsConfig = [];
            }
            
            const request:EasyGeminiRequest = {
                systemInstruction : system_temp_prompt,
                contents : content_temp,
                generationConfig:{
                    temperature:INtemperature,
                    maxOutputTokens:INmaxOutputTokens
                },
                tools: toolsConfig
            }//发出请求
            //console.log(request.contents[0].parts[0].text)
            const llmSource = readIni(path.join(__dirname,'../../../library_source.ini'),'main_virtual_source');
            let response: EasyGeminiResponse;
            if (llmSource === 'deepseek') {
                response = await callDeepSeekTemp(
                    request,
                    readIni(path.join(__dirname,'../../../library_source.ini'),'deepseek_api_sky'),
                    "deepseek-chat",
                    "https://api.deepseek.com"
                );
            } else {
                response = await callGoogleLLM(
                    request,
                    readIni(path.join(__dirname,'../../../library_source.ini'),'google_api_key'),
                    "gemini-3-pro-preview",
                    readIni(path.join(__dirname,'../../../library_source.ini'),'google_base_url')
                );
            }//调用LLM模型
            /*
1. gemini-3.1-pro-preview - 最新的 Pro 版本预览，功能最全面
2. gemini-3-pro-preview - 当前代码中使用的模型，性能和功能都很强大
3. gemini-3-flash-preview - 最新的 Flash 版本，响应速度更快
### 稳定版本模型
1. gemini-2.5-pro - 稳定的 Pro 版本，平衡了性能和功能
2. gemini-2.5-flash - 稳定的轻量版本，响应速度快
3. gemini-2.0-flash - 较早的轻量版本，适合简单任务
### 其他特殊模型
             */
            // 检查是否有函数调用
            // 如果第一次请求返回空内容，进行重试和API切换
            let initialRetryCount = 0;
            const initialMaxRetries = 3;
            let currentKey = getApiKeyManager().getCurrentKey();
            
            while (!response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
                initialRetryCount++;
                
                if (initialRetryCount <= initialMaxRetries) {
                    console.log(`⚠️ 第一次请求返回空内容，正在重新请求... (第 ${initialRetryCount} 次重试)`);
                } else {
                    // 重试3次后切换API
                    console.log(`⚠️ 重试 ${initialMaxRetries} 次后仍返回空内容，尝试切换 API 源...`);
                    const nextKey = getApiKeyManager().switchToNextKey();
                    
                    if (!nextKey) {
                        console.error('❌ 所有 API 源都已尝试，无法获取有效响应');
                        throw new Error('所有 API 源都返回空内容，请检查服务状态');
                    }
                    
                    currentKey = nextKey;
                    console.log(`🔄 已切换到 API key ${currentKey?.priority}`);
                    initialRetryCount = 1; // 重置重试计数
                }
                
                if (llmSource === 'deepseek') {
                    response = await callDeepSeekTemp(
                        request,
                        readIni(path.join(__dirname,'../../../library_source.ini'),'deepseek_api_sky'),
                        "deepseek-chat",
                        "https://api.deepseek.com"
                    );
                } else {
                    response = await callGoogleLLM(
                        request,
                        currentKey?.key || readIni(path.join(__dirname,'../../../library_source.ini'),'google_api_key'),
                        "gemini-3-pro-preview",
                        currentKey?.baseUrl || readIni(path.join(__dirname,'../../../library_source.ini'),'google_base_url')
                    );
                }
            }//失败的重试逻辑
            
            // 处理 function calls 的循环，直到模型返回文本
            let functionCallLoopCount = 0;
            const maxFunctionCallLoops = 15; // 防止无限循环
            let thoughtSignatureRetryCount = 0;
            const maxThoughtSignatureRetries = 3;
            
            while (response.functionCalls && response.functionCalls.length > 0 && functionCallLoopCount < maxFunctionCallLoops) {
                functionCallLoopCount++;
                console.log(`🔄 处理第 ${functionCallLoopCount} 轮 function calls`);
                
                // 检查所有 functionCall 是否都有 thoughtSignature
                const missingSignatureCall = response.functionCalls.find(fc => !fc.thoughtSignature);
                if (missingSignatureCall) {
                    thoughtSignatureRetryCount++;
                    if (thoughtSignatureRetryCount > maxThoughtSignatureRetries) {
                        const errorMsg = `错误：函数调用 ${missingSignatureCall.name} 缺少 thoughtSignature 字段，已重试 ${maxThoughtSignatureRetries} 次`;
                        console.log('❌', errorMsg);
                        throw new Error(errorMsg);
                    }
                    console.log(`⚠️ thoughtSignature 缺失，重新请求... (第 ${thoughtSignatureRetryCount} 次重试)`);
                    
                    // 重新请求 LLM
                    if (llmSource === 'deepseek') {
                        response = await callDeepSeekTemp(
                            request,
                            readIni(path.join(__dirname, '../../../library_source.ini'), 'deepseek_api_sky'),
                            "deepseek-chat",
                            "https://api.deepseek.com"
                        );
                    } else {
                        response = await callGoogleLLM(
                            request,
                            currentKey?.key || readIni(path.join(__dirname, '../../../library_source.ini'), 'google_api_key'),
                            "gemini-3-pro-preview",
                            currentKey?.baseUrl || readIni(path.join(__dirname, '../../../library_source.ini'), 'google_base_url')
                        );
                    }
                    continue;
                }
                
                // 重置计数器（成功获取到 thoughtSignature）
                thoughtSignatureRetryCount = 0;
                
                // 为每个函数调用生成响应
                for (const functionCall of response.functionCalls) {

                    // 记录函数调用（由 model 发出）
                    const functionCallMessage: Message = {
                        current: '',
                        role_type: 'model',
                        role: 'cyanAI',
                        time: now(),
                        file: [],
                        inline: [],
                        toolsCalls: [{
                            name: functionCall.name.replace('default_api:', ''),
                            args: functionCall.args,
                            thoughtSignature: functionCall.thoughtSignature
                        }],
                        toolsResponse: []
                    };
                    main_status?.context.push(functionCallMessage);
                    // 调用工具
                    let toolResult = `成功调用了功能：${functionCall.name}`;
                    try {
                        // 从 args 中获取 requirement_text
                        const requirementText = functionCall.args?.requirement_text || functionCall.args?.text || JSON.stringify(functionCall.args);
                        const toolName = functionCall.name.replace('default_api:', '');
                        console.log(`调用工具 ${toolName}，参数：`, functionCall.args);
                        // 从 args 中获取 wait_mode，默认为 true
                        const waitMode = functionCall.args?.wait_mode ?? true;
                        // 调用 tool_process.ts 执行工具
                        toolResult = await excuteTool(toolName, requirementText, waitMode);
                        console.log(`工具 ${toolName} 执行结果：`, toolResult);
                    } catch (error: any) {
                        console.error(`工具调用失败：`, error);
                        toolResult = `工具调用失败：${error.message || '未知错误'}`;
                    }
                    // 生成成功响应（由 user 发出）
                    const functionResponseMessage: Message = {
                        current: '',
                        role_type: 'user',
                        role: 'system',
                        time: now(),
                        file: [],
                        inline: [],
                        toolsCalls: [],
                        toolsResponse: [{
                            name: functionCall.name,
                            response: {
                                result: toolResult
                            }
                        }]
                    };
                    main_status?.context.push(functionResponseMessage);
                }
                
                // 重新发送请求继续对话
                const retryRequest: EasyGeminiRequest = {
                    systemInstruction: system_temp_prompt,
                    contents: content_temp,
                    generationConfig: {
                        temperature: INtemperature,
                        maxOutputTokens: INmaxOutputTokens
                    },
                    tools: toolsConfig
                };
                
                // 重新构建内容，包含函数调用和响应
                // 使用与初始构建相同的合并逻辑
                const retryContent: content_unit[] = [];
                let last_retry_unit: content_unit | null = null;
                
                main_status?.context.map((curr) => {
                    // 检查是否可以和上一条合并（相同role_type）
                    if (last_retry_unit && last_retry_unit.role === curr.role_type) {
                        // 合并到同一个content_unit的parts中
                        if (curr.current !== "") {
                            const temp_text = '^' + curr.role + ':' + curr.time + ':' + curr.current;
                            last_retry_unit.parts.push({ text: temp_text });
                        }
                        
                        if (curr.inline.length !== 0) {
                            curr.inline.map((inlineUnit) => {
                                last_retry_unit!.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                            });
                        }
                        
                        // 处理工具调用（只有 model 类型的消息才有）
                        if (curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                            curr.toolsCalls.map((toolCall) => {
                                const part: any = {
                                    functionCall: {
                                        name: `default_api:${toolCall.name}`,
                                        args: toolCall.args
                                    }
                                };
                                if (toolCall.thoughtSignature) {
                                    part.thoughtSignature = toolCall.thoughtSignature;
                                }
                                last_retry_unit!.parts.push(part);
                            });
                        }
                        
                        // 处理工具响应（只有 user 类型的消息才有）
                        if (curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                            curr.toolsResponse.map((toolResponse) => {
                                last_retry_unit!.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                            });
                        }
                    } else {
                        // 创建新的content_unit
                        const temp_unit: content_unit = {
                            role: curr.role_type,
                            parts: []
                        };
                        
                        if (curr.current !== "") {
                            const temp_text = '^' + curr.role + ':' + curr.time + ':' + curr.current;
                            temp_unit.parts.push({ text: temp_text });
                        }
                        
                        if (curr.inline.length !== 0) {
                            curr.inline.map((inlineUnit) => {
                                temp_unit.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                            });
                        }
                        
                        // 处理工具调用（只有 model 类型的消息才有）
                        if (curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                            curr.toolsCalls.map((toolCall) => {
                                const part: any = {
                                    functionCall: {
                                        name: `default_api:${toolCall.name}`,
                                        args: toolCall.args
                                    }
                                };
                                if (toolCall.thoughtSignature) {
                                    part.thoughtSignature = toolCall.thoughtSignature;
                                }
                                temp_unit.parts.push(part);
                            });
                        }
                        
                        // 处理工具响应（只有 user 类型的消息才有）
                        if (curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                            curr.toolsResponse.map((toolResponse) => {
                                temp_unit.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                            });
                        }
                        
                        retryContent.push(temp_unit);
                        last_retry_unit = temp_unit;
                    }
                });//构造上下文
                
                retryRequest.contents = retryContent;
                
                if (llmSource === 'deepseek') {
                    response = await callDeepSeekTemp(
                        retryRequest,
                        readIni(path.join(__dirname, '../../../library_source.ini'), 'deepseek_api_sky'),
                        "deepseek-chat",
                        "https://api.deepseek.com"
                    );
                } else {
                    response = await callGoogleLLM(
                        retryRequest,
                        readIni(path.join(__dirname, '../../../library_source.ini'), 'google_api_key'),
                        "gemini-3-pro-preview",
                        readIni(path.join(__dirname, '../../../library_source.ini'), 'google_base_url')
                    );
                }//发送请求
                
                // 如果返回空内容，继续重新请求（重试+切换API）
                let retryCount = 0;
                const maxRetries = 3;
                let retryKey = currentKey; // 使用当前key
                
                while (!response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
                    retryCount++;
                    
                    if (retryCount <= maxRetries) {
                        console.log(`⚠️ 模型返回空内容，正在重新请求... (第 ${retryCount} 次重试)`);
                    } else {
                        // 重试3次后切换API
                        console.log(`⚠️ 重试 ${maxRetries} 次后仍返回空内容，尝试切换 API 源...`);
                        const nextKey = getApiKeyManager().switchToNextKey();
                        
                        if (!nextKey) {
                            console.error('❌ 所有 API 源都已尝试，无法获取有效响应');
                            throw new Error('所有 API 源都返回空内容，请检查服务状态');
                        }
                        
                        retryKey = nextKey;
                        console.log(`🔄 已切换到 API key ${retryKey?.priority}`);
                        retryCount = 1; // 重置重试计数
                    }
                    
                    // 重新构建内容
                    const retryContent2: content_unit[] = [];
                    let last_retry_unit2: content_unit | null = null;
                    
                    main_status?.context.map((curr) => {
                        if (last_retry_unit2 && last_retry_unit2.role === curr.role_type) {
                            if (curr.current !== "") {
                                const temp_text = '^' + curr.role + ':' + curr.time + ':' + curr.current;
                                last_retry_unit2.parts.push({ text: temp_text });
                            }
                            if (curr.inline.length !== 0) {
                                curr.inline.map((inlineUnit) => {
                                    last_retry_unit2!.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                                });
                            }
                            if (curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                                curr.toolsCalls.map((toolCall) => {
                                    const part: any = {
                                        functionCall: {
                                            name: `default_api:${toolCall.name}`,
                                            args: toolCall.args
                                        }
                                    };
                                    if (toolCall.thoughtSignature) {
                                        part.thoughtSignature = toolCall.thoughtSignature;
                                    }
                                    last_retry_unit2!.parts.push(part);
                                });
                            }
                            if (curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                                curr.toolsResponse.map((toolResponse) => {
                                    last_retry_unit2!.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                                });
                            }
                        } else {
                            const temp_unit: content_unit = {
                                role: curr.role_type,
                                parts: []
                            };
                            if (curr.current !== "") {
                                const temp_text = '^' + curr.role + ':' + curr.time + ':' + curr.current;
                                temp_unit.parts.push({ text: temp_text });
                            }
                            if (curr.inline.length !== 0) {
                                curr.inline.map((inlineUnit) => {
                                    temp_unit.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                                });
                            }
                            if (curr.role_type === 'model' && curr.toolsCalls && curr.toolsCalls.length > 0) {
                                curr.toolsCalls.map((toolCall) => {
                                    const part: any = {
                                        functionCall: {
                                            name: `default_api:${toolCall.name}`,
                                            args: toolCall.args
                                        }
                                    };
                                    if (toolCall.thoughtSignature) {
                                        part.thoughtSignature = toolCall.thoughtSignature;
                                    }
                                    temp_unit.parts.push(part);
                                });
                            }
                            if (curr.role_type === 'user' && curr.toolsResponse && curr.toolsResponse.length > 0) {
                                curr.toolsResponse.map((toolResponse) => {
                                    temp_unit.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                                });
                            }
                            retryContent2.push(temp_unit);
                            last_retry_unit2 = temp_unit;
                        }
                    });
                    
                    retryRequest.contents = retryContent2;
                    
                    if (llmSource === 'deepseek') {
                        response = await callDeepSeekTemp(
                            retryRequest,
                            readIni(path.join(__dirname, '../../../library_source.ini'), 'deepseek_api_sky'),
                            "deepseek-chat",
                            "https://api.deepseek.com"
                        );
                    } else {
                        response = await callGoogleLLM(
                            retryRequest,
                            retryKey?.key || readIni(path.join(__dirname, '../../../library_source.ini'), 'google_api_key'),
                            "gemini-3-pro-preview",
                            retryKey?.baseUrl || readIni(path.join(__dirname, '../../../library_source.ini'), 'google_base_url')
                        );
                    }
                }//请求失败的重试循环
                
                // 如果所有API都尝试过仍返回空内容，抛出错误
                if (!response.text && (!response.functionCalls || response.functionCalls.length === 0)) {
                    console.error('❌ 所有 API 源都返回空内容');
                    throw new Error('所有 API 源都返回空内容，请检查服务状态');
                }
            }//函数调用的流程循环
            
            // 检查是否超过最大循环次数
            if (functionCallLoopCount >= maxFunctionCallLoops) {
                console.error(`❌ 超过最大 function call 循环次数 (${maxFunctionCallLoops})`);
                throw new Error('模型连续返回 function calls，超过最大处理次数');
            }
            
            // 只有在有文本内容时才添加消息
            if (response.text && response.text.trim() !== '') {
                console.log(response.text);
                addMessageFromString(
                    remove_timestamp(response.text),
                    "model",
                    "cyanAI"
                );
            } else if (response.functionCalls && response.functionCalls.length > 0) {
                // 如果只有 function call 没有文本，不应该到达这里，因为上面已经处理了
                console.log('⚠️ 模型只返回了 function call，没有文本');
            }
            //然后存下文件
            saveCoreStateForFile()
            input_for_uid(final_output_pipe_source_uid,response.text,"string")
            main_virtual_busy = false;
            process_waiting().catch((error: any) => {
                console.error('process_waiting调用失败:', error);
            });
            return "SUCCESS:回复正常"
        }catch(error: any){
            console.error('sendAll 错误:', error);
            main_virtual_busy = false;
            process_waiting().catch((error: any) => {
                console.error('process_waiting调用失败:', error);
            });
            return "ERROR:状态合法但是发生错误"
        }
        
    }
    main_virtual_busy = false;
    process_waiting().catch((error: any) => {
        console.error('process_waiting调用失败:', error);
    });
    
    return "ERROR:当前状态不合法"
}//这个函数发送当前的的上下文状态给模型,并且模型的回复会添加在main_status的上下文里，返回的只是执行状态
//修改:sendAll会调用
let final_output_pipe_source_uid = creat_source("main_virtual_final_output", "string")
//其注册一个source:main_virtual_final_output

/*
export function context_back():string
{
//删除靠尾的Message，直到最后一条是user
//如果最后一条原本就是user，则不管
//注意：functionCall 由 model 发出，functionResponse 由 user 发出
if(main_status && (main_status.context.length !== 0 ))
{
    while(main_status.context.length > 0)
    {
        const last_role_type = main_status.context[main_status.context.length - 1].role_type;
        if(last_role_type === "user")
        {
            return "SUCCESS:上下文已回退";
        }
        main_status.context.pop();
    }
    return "SUCCESS:上下文已清空";
}
return "ERROR:上下文为空";
}//回退上下文直到最后一条是user或function
*/

//-----------------------------这里是前端直接用到的函数--------------------------------------
export async function sendUserMessage(send_curr:string,user_name:string):Promise<string>{
    //会先判断现在有没有status,如果没有就先新建一个
    if(!main_status)
        if(isError(getCoreStateForFile()))
            return "ERROR:获取内核状态错误"
    //现在有了内核状态,准备先添加从前端传来的消息，再发送
    addMessageFromString(send_curr,"user",user_name);
    let temp_sendAll_response = await sendAll()
    if(isError(temp_sendAll_response))
        return ("ERROR:发送信息时错误:" + temp_sendAll_response)
    //获取消息列表的最后一条消息返回
    let send_response = main_status?.context[main_status?.context.length - 1].current
    if(send_response)
        return send_response
    return "ERROR:历史记录的最后一条获取失败"
}//以用户的身份发送信息，不支持工具调用
export function addQueueMessage(send_curr:string,user_name:string,files:string[] = [],inlines:inlineData[] = []):string{
    //会先判断现在有没有status,如果没有就先新建一个
    if(!main_status)
        if(isError(getCoreStateForFile()))
            return "ERROR:获取内核状态错误"
    //现在有了内核状态,准备添加从前端传来的消息到队列，但不发送
    const result = addMessageFromString(send_curr,"user",user_name,files,inlines);
    if(result.startsWith("SUCCESS"))
        return "SUCCESS:消息已加入队列"
    else
        return "ERROR:添加消息到队列失败"
}//以用户的身份添加消息到status
let waiting_message:QueueMessageInput[] = []
export function autoAddMessage(pack: standard_message_pack)
{
    if(main_virtual_busy) {
        for (const item of pack.items) {
            const formatted_curr = `QQ联系人:${item.user_name}发来了消息：${item.send_curr}`;
            waiting_message.push({
                send_curr: formatted_curr,
                user_name: "system",
                files: item.files,
                inlines: item.inlines
            })
        }
    } else {
        for (const item of pack.items) {
            const formatted_curr = `QQ联系人:${item.user_name}发来了消息：${item.send_curr}`;
            addQueueMessage(formatted_curr, "system", item.files, item.inlines)
        }
        sendAll().catch((error: any) => {
            console.error('autoAddMessage发送消息失败:', error);
        });
    }
}//发送一组信息
export function autoAddDirectlyMessage(pack: standard_message_pack)
{
    if(main_virtual_busy) {
        waiting_message.push(...pack.items)
    } else {
        for (const item of pack.items) {
            addQueueMessage(item.send_curr, item.user_name, item.files, item.inlines)
        }
        sendAll().catch((error: any) => {
            console.error('autoAddMessage发送消息失败:', error);
        });
    }
}//直接发送一组信息，不是QQ什么乱七八糟的
async function process_waiting()
{
    if(waiting_message.length === 0) return;
    waiting_message.map((curr)=>{
        addQueueMessage(curr.send_curr, curr.user_name, curr.files, curr.inlines)
    })
    waiting_message = []
    await sendAll()
}
export function exit_status():boolean{
    if(main_status)
        return true;
    else
        return false;
}//检查main_status是否在变量里存在
export async function finish_event():Promise<string>{
    if(!main_status)
        if(isError(getCoreStateForFile()))
            return "ERROR:获取内核时错误"
    //先看看要不要做什么收尾工作
    //这部分涉及到tools调用的上下文继承，还没写，所以这里也待定
    //...
    
    //然后压缩事件内容到event,首先会通过sendUserMessage向模型发送一条特殊的名字为system的信息，然后调用
    let temp_res_event_summary:string = await sendUserMessage(readFileSyncAsString(readIni(path.join(__dirname,'../../../library_source.ini'),'event_summary_guide')),'system')
    //然后取得重要程度
    let temp_res_event_Im_raw:string = await sendUserMessage(readFileSyncAsString(readIni(path.join(__dirname,'../../../library_source.ini'),'event_Im_guide')),'system')
    console.log("模型返回的重要程度原始内容:", temp_res_event_Im_raw);
    // 从返回的文本中提取数字
    const numberMatch = temp_res_event_Im_raw.match(/(\d+\.?\d*)/);
    let temp_res_event_Im:number = numberMatch ? parseFloat(numberMatch[1]) : 0;
    console.log("正在总结对话，该对话的总结内容是"+temp_res_event_summary+ "\n当前对话事件的重要程度是" + temp_res_event_Im.toString())
    //写入事件
    saveEvent(main_status!.context.slice(0,-2),temp_res_event_summary,temp_res_event_Im);
    
    //删除 status 文件
    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
    if (fs.existsSync(statusPath)) {
        fs.unlinkSync(statusPath);
    }
    
    //把变量设置为 null
    main_status = null;
    
    //弄好了
    return "SUCCESS:已经写入文件"
}//把当前的status里的上下文压缩进event，然后删除status
export async function memoryless_talk(input:string,role:string = "system"):Promise<string>{
    const temp_status = JSON.parse(JSON.stringify(main_status));//备份
    let response_text:string = await sendUserMessage(input,role);
    main_status = temp_status;//还原
    return response_text;
}//把输入文本传入，然后等待主线程的回复，返回，然后回退记录，就像没问过一样，这个功能计费比较高，和一次正常的sendUserMessage一样
//---------------------------这里是栈操作相关的函数-----------------------------------
class status_stack
{
    public data:total_status[] = [];//data其实表示main_status之上的玩意，所以其默认为空
    public push():void{
        this.data.push(JSON.parse(JSON.stringify(main_status)));
    }//基于当前状态压栈
    public break():boolean{
        if(this.data.length == 0)
            return false;
        main_status = JSON.parse(JSON.stringify(this.data[this.data.length - 1]))
        this.data.pop();
        return true
    }//跳出，成功则返回true
    public clear():void{
        this.data=[]
    }
}//可以push,break,clear啥的
let main_status_stack:status_stack = new status_stack();//这玩意必须初始化
//---------------------------这里是浮空栈相关函数----------------------------------
class temp_stack{
    public status:total_status;
    public data:total_status[] = [];//data其实表示this.status之上的玩意，所以其默认为空
    
    constructor(initialStatus: total_status) {
        this.status = initialStatus;
    }
    
    public push():void{
        this.data.push(JSON.parse(JSON.stringify(this.status)));
    }//基于当前状态压栈
    public break():boolean{
        if(this.data.length == 0)
            return false;
        this.status = JSON.parse(JSON.stringify(this.data[this.data.length - 1]))
        this.data.pop();
        return true
    }//跳出，成功则返回true
    public clear():void{
        this.data=[]
    }
    public set(input:total_status):void{
        this.status = input;
    }
}//额外拥有一个主状态的栈,多个set方法
//temp_stack被利用是依靠劫持main_status来实现的，所以其不能多线程并行，之后有机会重构
//也就是说，main_status_stack先进行压栈，在新压的栈里面进行temp_stack的运行，然后temp_stack在劫持动作结束以后，把main_status写入自己的当前栈点
let now_takeover:temp_stack|null = null;//当前接管的temp_stack

//开始接管，将main_status替换为temp_stack的status
export function temp_stack_takeover_start(input:temp_stack):void{
    now_takeover = input;
    main_status_stack.push();
    main_status = input.status;
}

//结束接管，将main_status写回temp_stack，并恢复main_status_stack
export function temp_stack_takeover_end():void{
    if(now_takeover === null) return;
    now_takeover.status = main_status;
    main_status_stack.break();
    now_takeover = null;
}

//接管期间的push操作：先结束接管，执行temp.push()，再重新开始接管
export function takeover_push():void{
    if(now_takeover === null) return;
    const temp = now_takeover;
    temp_stack_takeover_end();
    temp.push();
    temp_stack_takeover_start(temp);
}

//接管期间的break操作：先结束接管，执行temp.break()，再重新开始接管
export function takeover_break():boolean{
    if(now_takeover === null) return false;
    const temp = now_takeover;
    temp_stack_takeover_end();
    const result = temp.break();
    temp_stack_takeover_start(temp);
    return result;
}
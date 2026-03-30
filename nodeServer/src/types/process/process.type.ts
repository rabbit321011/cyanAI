export interface inlineData{
    mimeType:string;//这里指定类型是
    data:string;//必须是纯base64字符串，不能含前缀
}
export interface functionCall{
    name:string
    args:{
        [key: string]: any;//这是输入的参数
    }
    thoughtSignature?:string;//模型调用函数的思考过程
}
export interface functionResponse{
    name:string
    response:{
        [key: string]: any;//这是输出的内容
    }
}
export interface Message {
    current:string;//这是原始的文本内容，是没有转义的,不带时间和发言人
    role_type:string;//这是发言人的类型,可以是user,或者model
    role:string;//这是发言者的名字
    time:string;//这是基于cyanTime的标准时间字符串
    file:string[];//这是附带的文件,是一个数组，每个成员都是一个完整的文件路径
    inline:inlineData[];//这是附带的内联文件
    toolsCalls:functionCall[];//这是做出的functionCall，只有model类型才有
    toolsResponse:functionResponse[];//这是回答的functionResponse，只有user类型才有
}
export interface TextMessage{
    text:string;//这是文本内容
    role:string;//这是角色
}//这是Message的衍生类,纯文本的信息类
export interface MemoryState{//这玩意需要自行配合保存时间戳才能用哈
    R:number,//记忆强度衰减
    S:number,//记忆稳定性
    last_T_distance:string,//上次提起到本次提起距离的时间，遵守cyanTime的定义
    D:number,//遗忘难度
    a:number//增益系数
}//这个玩意在不同地方的各个参数的定义大相径庭
export interface LinesP {
    path: string;
    index: "order" | string;
    reference: Array<{
        start: string;
        end: string;
    }>;
}//这玩意是LineP对象
export interface EventOutputItem {
    source: LinesP;
    current: string;
}//这玩意是事件列表
export interface routeOutput{
    stop:boolean;
    datas:any;
}//这玩意是路由的输出
export interface QueueMessageInput{
    send_curr:string;
    user_name:string;
    files:string[];
    inlines:inlineData[];
}//等待消息队列的输入格式
export interface standard_message_pack{
    items:QueueMessageInput[]
}
export interface multimedia_message{
    type:'text'|'image'|'audio'|'video'|'file';
    content:string;
    inline?:inlineData;
    file_url?:string;
}//多媒体消息部分，支持文本、图片、音频、视频、文件
export interface multi_contact_multimedia_message{
    id:string;
    name:string;
    parts:multimedia_message[];
}//多联系人多媒体消息格式
export interface multi_contact_multimedia_message_array{
    messages:multi_contact_multimedia_message[];
}//多联系人多媒体消息数组格式
export interface policy_group{
    mode:string; //运行模式，控制数据流向
    // 可选值: memory_less(不保存记忆), chat(空壳子), tiny(基础模式), lite(性能优化), multi_status(多状态), normal(正常模式), thinking(思考模式)
    temperature:number; //生成文本的温度参数
    monologue:boolean; //是否开启独白模式
    monologue_summary_turn:number; //独白总结触发轮次，默认为6
    monologue_summary_turn_precision:number; //独白总结精度，表示每多少轮触发一次总结，默认为3
    summary_turn:number; //总结触发轮次，默认为30
    summary_turn_time:string; //总结触发时间，单位如10min
    summary_turn_precision:number; //总结精度，表示每多少轮触发一次总结，默认为20
    image_max:number; //图片保留数量，超过则总结
    video_max:number; //视频保留数量，超过则总结
    audio_max:number; //音频保留数量，超过则总结
    multimedia_max:number; //多媒体总保留数量，超过则总结
    tools_files:string[]; //启用的工具索引JSON文件数组
    talk_commands:string[]; //可用的talk命令数组，需要在tools_files中定义
    talk_description_file:string; //talk命令描述文件路径，会拼接到系统提示词
    direct_tools:string[]; //直接载入的工具数组
    auto_rag_topk:number; //自动RAG检索返回的数量，-1检索所有，0不开启
    auto_reranker_mode:string; //自动重排模式，可选"qwen"或"bge"
    auto_emerge_rate:number; //自动涌现阈值倍率
    auto_emerge_frequency:number; //自动检索频率，单位为rethink
    workspace:boolean; //是否开启工作区功能
    pull_info:boolean; //是否开启拉取信息功能
    step_progress:boolean; //是否开启步进计划功能
    change_policy_group:string[]; //允许切换到的策略组名称数组
    system_prompt_generator:string; //系统提示词生成器文件路径，用于生成系统提示词
    max_events:number; //检索事件的最大数量，默认为100
    events_threshold:number; //事件检索阈值，低于此值的事件不会被检索
    events_Tw_normalization_factor:number; //事件Tw归一化因子，默认为0，最大为1
    dynamic_pipe_node:string; //动态管道节点文件路径，用于自定义输入输出转换
    max_token:number; //最大输出token数
    model:string; //模型名称
    model_type:string; //模型类型，如gemini、deepseek等
}//策略组文件
export interface inlineData{
    mimeType:string;//这里指定类型是
    data:string;//必须是纯base64字符串，不能含前缀
}
export interface functionCall{
    name:string
    args:{
        [key: string]: any;//这是输入的参数
    }
}
export interface functionResponse{
    name:string
    response:{
        [key: string]: any;//这是输出的内容
    }
}
export interface Message {
    current:string;//这是原始的文本内容，是没有转义的,不带时间和发言人
    role_type:string;//这是发言人的类型,可以是function,user,或者model
    role:string;//这是发言者的名字,如果是role_type==function,这里为空
    time:string;//这是基于cyanTime的标准时间字符串，如果role_type==function,这里为空
    file:string[];//这是附带的文件,是一个数组，每个成员都是一个完整的文件路径，如果role_type==function,这里为空
    inline:inlineData[];//这是附带的内联文件，如果role_type==function,这里为空
    toolsCalls:functionCall[];//这是做出的functionCall，如果role_type==function,这里为空
    toolsResponse:functionResponse[];//这是回答的functionResponse，如果role_type!=function,这里为空
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
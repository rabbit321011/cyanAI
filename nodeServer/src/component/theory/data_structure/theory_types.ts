/*
export interface theory{
    id:string,//一般是该理论的名字（20字以内），需要独一无二，如果有冲突可以修改，牵一发会动其覆盖的abstruct_node节点
    brief:string,//是该理论的简述，介绍的是该理论的描述对象，适用范围，以及该理论的作用。建议100字以内
    abstuct_node_id:string|null,//是该理论在abstruct_tree上的节点名，一般来说和id是一样的，如果该理论没有在abstruct_tree上，本值就是null
    text:string,//描述该理论的完整文本，需要保证sub_nodes_id都在里面，而且如果提到sub_nodes_id在被提到的时候以#{string}包裹
    sub_nodes_id:string[]//该理论所辖的abstruct节点们的id
}
*///原本的theory类型已经废弃
import { weight_key } from "../../../types/data/data.type";
export interface erogenous_point{
    name:string,//这个name实际上是激活词
    uid:string,//使用get_id生成
    parents:weight_key,//这个key的键名也是theory的uid
    source_activation:number[],//长度10的数组，表示最近10次对话的原始激活词
    final_activation:number,//最终激活值，10次衰减完
}//节点在生成的时候会单次尝试变为最大抽象化节点
//这玩意自带
//每次激活操作在用户说完话时进行，一问一答视为一个整体，享有相同的衰减权重
export interface theory{
    name:string,//理论名，目前没想到有什么用
    uid:string,//使用get_id生成
    sub_erogenous_point:weight_key[],//其子的erogenous_point节点
    activation_threshold:number,//从0到1，表示sub_erogenous_point的总激活值*weight的和后的阈值，默认值待调试，大于这个值则会进行memory_less操作来确证是否引入，如果不需要则
    activation_threshold_correction:number,//默认为0，如果激活失败，则这玩意加一个值，这个值随着时间衰减，最小为0，指数衰减，半衰期为5次对话
}
export interface build_theory extends theory{
    sub_struct_uid:string,//其衍生struct的uid,是必要的
    text:string,//长文本，用以说明这个build
    base_theory_uid:string[],//这个uid只是选填，实际上，其只有不稳定的参考意义，是由模型输出的
}//建构统治性，其目的是“说服”,而且是在没有基座theory的情况下说服
//其需要确认一切细节都叙述清楚了，所以text只是被建立，实际上只要其基座theory不被去掉，工程上，为了上下文其保持未优化的形态
export interface struct_theory extends theory{
    parent_build_uid:string,//非必要的，如果为空则为"",其对应的build_theory的uid
    sub_persuade_uid:string[],//必要的，对应的persuade_theory的uid
    text:string,//长文本，系统的叙述这个结构
    base_theory_uid:string[],
}//结构统治性，其目的是"结构"，而且是在没有基座theory的情况下结构
//其需要确认能说明好了一切细节，合适的方式就是把当前的情况放在struct里面分析，可以通过memoryless截取原文给struct在新的对话窗口里面测试
//而且需要严格的叙述了其子persuade_theory
export interface persuade_theory extends theory{
    parent_struct_uid:string,//非必要的，如果为空则为"",其对应的struct_theory的uid
    text:string,//一般就比较简短了
    base_theory_uid:string[],
}
//规劝统治性，其目的是离散的结论
//其仅仅需要确认不违反struct_theory

//创建这三种theory的时候，优先创建的是更详细的theory,然后创建详细的theory的时候就会尝试拓展到简化版本的theory
//清除theory一方面靠sub_erogenous_point权重的衰退，另一方面靠专门的清除函数
//这些玩意的实例化放在theory主文件里面，因为涉及到逻辑了
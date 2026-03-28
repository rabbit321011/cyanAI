//pipe是一种特殊的route,其特征是:高动态性,单输入单输出性,其可以通过converter实现其中间值的转换

import { get_id } from "../../utility/time/get_id"
import fs from 'fs'
import path from 'path'
class pipe{
    public input_uid:string;
    public output_uid:string;
    public type:string;
    //在这里新增构造函数
    constructor(init_input_uid:string,init_output_uid:string,init_type:string){
        this.input_uid = init_input_uid;
        this.output_uid = init_output_uid;
        this.type = init_type;
    }
    public reset_input(new_uid:string){
        this.input_uid = new_uid;
    }
    public reset_output(new_uid:string){
        this.output_uid = new_uid;
    }
}
let pipes:pipe[] =[];
/*
    interface pipe_node_data{
        uid:string,
        type:string
    }
*/
//let input_list:pipe_node_data[] = [];//包含default和route的
//let output_list:pipe_node_data[] = [];//同上
interface converter{
    input_uid:string,
    input_type:string,
    output_uid:string,
    output_type:string,
    runtime_data:any,
    converter_type:string//动态载入运行的是这玩意
}
let converters:converter[] =[];

export interface converter_uids {
    input_uid: string;
    output_uid: string;
}

export async function creat_converter(runtime_data:any,converter_type:string,in_name:string = "",out_name:string = ""):Promise<converter_uids | null>
{
    const converter_path = path.join(__dirname, 'converter', `${converter_type}.ts`);
    
    if(!fs.existsSync(converter_path))
    {
        console.error(`converter模块不存在: ${converter_type}`);
        return null;
    }
    
    try {
        const converter_module = await import(converter_path);
        const interface_types = converter_module.get_interface_type();
        
        const new_converter:converter = {
            input_uid: get_id(),
            input_type: interface_types.input_type,
            output_uid: get_id(),
            output_type: interface_types.output_type,
            runtime_data: runtime_data,
            converter_type: converter_type
        };
        converters.push(new_converter);
        if(in_name !== ""){
            reg_name(in_name, new_converter.input_uid)
        }
        if(out_name !== ""){
            reg_name(out_name, new_converter.output_uid)
        }
        return {
            input_uid: new_converter.input_uid,
            output_uid: new_converter.output_uid
        };
    } catch (error) {
        console.error(`加载converter模块失败: ${converter_type}`, error);
        return null;
    }
}
export function update_converter_runtime(uid: string, new_runtime_data: any): void {
    const converter = converters.find(c => c.input_uid === uid || c.output_uid === uid);
    if (converter) {
        converter.runtime_data = new_runtime_data;
    }
}
interface final_output{
    interface_uid:string,
    interface_type:string,
    data:any,
    output_type:string//索引到output文件夹下output_type.ts的output(runtime_data:any,data:any)方法
}
let final_outputs:final_output[] = [];
export async function creat_output(runtime_data:any,output_type:string):Promise<string>//返回uid
{
    const temp_uid = get_id();
    const output_path = path.join(__dirname, 'output', `${output_type}.ts`);
    
    if(!fs.existsSync(output_path))
    {
        console.error(`output模块不存在: ${output_type}`);
        return ""
    }
    
    try {
        const output_module = await import(output_path);
        const interface_type = output_module.get_type();
        
        final_outputs.push({
            interface_uid: temp_uid,
            interface_type: interface_type,
            data: runtime_data,
            output_type: output_type
        });
        
        return temp_uid;
    } catch (error) {
        console.error(`加载output模块失败: ${output_type}`, error);
        return ""
    }
}
export async function input_for_uid(uid:string,data:any,type:string):Promise<void>
{
    //从converters里检索 - 检查input_uid
    const converter = converters.find(c => c.input_uid === uid);
    if(converter){
        if(converter.input_type !== type){
            console.error(`converter类型不匹配: 期望 ${converter.input_type}, 实际 ${type}`);
            return;
        }
        //动态加载converter模块并执行output方法
        const converter_path = path.join(__dirname, 'converter', `${converter.converter_type}.ts`);
        try {
            const converter_module = await import(converter_path);
            await converter_module.output(data, converter.runtime_data, converter.output_uid, converter.output_type);
        } catch (error) {
            console.error(`加载converter模块失败: ${converter.converter_type}`, error);
        }
        return;
    }
    
    //从final_outputs里检索
    const final_output = final_outputs.find(f => f.interface_uid === uid);
    if(final_output){
        if(final_output.interface_type !== type){
            console.error(`final_output类型不匹配: 期望 ${final_output.interface_type}, 实际 ${type}`);
            return;
        }
        //动态加载output模块并执行output方法
        const output_path = path.join(__dirname, 'output', `${final_output.output_type}.ts`);
        try {
            const output_module = await import(output_path);
            await output_module.output(final_output.data, data);
        } catch (error) {
            console.error(`加载output模块失败: ${final_output.output_type}`, error);
        }
        return;
    }
    
    //从pipes里检索
    const pipe = pipes.find(p => p.input_uid === uid);
    if(pipe){
        //pipe只是连接，传递数据到output_uid
        await input_for_uid(pipe.output_uid, data, type);
        return;
    }
    
    console.error(`未找到uid: ${uid}`);
}
interface source_interface{
    uid:string,
    type:string
}
let sources:source_interface[] = []//source们的uid
export function creat_source(name:string = "",type:string = "string"):string//返回uid
{
    let temp_uid = get_id();
    console.log("注册了source:"+name+"("+temp_uid+")")
    sources.push({uid: temp_uid, type: type});
    if(name!=="")
    {
        reg_name(name,temp_uid)
    }
    return temp_uid;
}//source该调用这个来注册
export function remove_source(uid:string):string//返回执行结果
{
    const temp_test_index = sources.findIndex(s => s.uid === uid);
    if(temp_test_index === -1)
    {
        return "ERROR:未找到指定的source"
    }
    sources.splice(temp_test_index, 1);
    return "SUCCESS:source删除成功"
}
export function creat_pipe(uid_in:string,uid_out:string):string//返回执行结果
{
    //自动将name转换为uid
    const uid_in_resolved = find_name_uid(uid_in) || uid_in;
    const uid_out_resolved = find_name_uid(uid_out) || uid_out;
    
    //检查uid_in在converters的输出uid 或 sources 内
    const temp_test_converter_output_uids = converters.map(c => c.output_uid);
    const temp_test_source_uids = sources.map(s => s.uid);
    const temp_test_valid_input_uids = [...temp_test_converter_output_uids, ...temp_test_source_uids];
    if(!temp_test_valid_input_uids.includes(uid_in_resolved))
    {
        return "ERROR:无效的输入uid"
    }
    //检查uid_out是否为converters的输入或final_outputs的interface_uid
    const temp_test_converter_input_uids = converters.map(c => c.input_uid);
    const temp_test_final_output_uids = final_outputs.map(f => f.interface_uid);
    const temp_test_valid_output_uids = [...temp_test_converter_input_uids, ...temp_test_final_output_uids];
    if(!temp_test_valid_output_uids.includes(uid_out_resolved))
    {
        return "ERROR:无效的输出uid"
    }
    //检查输入和输出的type是否一样
    let temp_test_input_type = "";
    let temp_test_output_type = "";
    
    const temp_test_input_converter = converters.find(c => c.output_uid === uid_in_resolved);
    if(temp_test_input_converter){
        temp_test_input_type = temp_test_input_converter.output_type;
    }else if(temp_test_source_uids.includes(uid_in_resolved)){
        const temp_test_source = sources.find(s => s.uid === uid_in_resolved);
        temp_test_input_type = temp_test_source ? temp_test_source.type : "source";
    }
    
    const temp_test_output_converter = converters.find(c => c.input_uid === uid_out_resolved);
    if(temp_test_output_converter){
        temp_test_output_type = temp_test_output_converter.input_type;
    }else{
        const temp_test_output_final = final_outputs.find(f => f.interface_uid === uid_out_resolved);
        if(temp_test_output_final){
            temp_test_output_type = temp_test_output_final.interface_type;
        }
    }
    
    if(temp_test_input_type !== temp_test_output_type)
    {
        return "ERROR:接口类型错误,输入接口的类型为:"+temp_test_input_type+",输出接口的类型为"+temp_test_output_type
    }
    //开始绑定
    const temp_test_new_pipe = new pipe(uid_in_resolved, uid_out_resolved, "const");
    pipes.push(temp_test_new_pipe);
    return "SUCCESS:pipe创建成功"
}//创建一个pipe
export function remove_pipe(uid:string):string
{
    const temp_test_index = pipes.findIndex(p => p.input_uid === uid || p.output_uid === uid);
    if(temp_test_index === -1)
    {
        return "ERROR:未找到指定的pipe"
    }
    pipes.splice(temp_test_index, 1);
    return "SUCCESS:pipe删除成功"
}//删除一个pipe
interface uidWithName_pair{
    name:string,
    uid:string
};
let uidWithName_pairs:uidWithName_pair []=[];
export async function init(){
    const list_path = path.join(__dirname, 'status_output.list');
    if(!fs.existsSync(list_path)){
        console.error('status_output.list 文件不存在');
        return;
    }
    const list_content = fs.readFileSync(list_path, 'utf-8');
    const lines = list_content.split('\n').filter(line => line.trim() !== '');
    for(const line of lines){
        const output_type = line.trim();
        if(!output_type) continue;
        //去掉.ts后缀作为name
        const name = output_type.replace(/\.ts$/, '');
        //调用creat_output，runtime_data为null
        const uid = await creat_output(null, name);
        if(uid){
            uidWithName_pairs.push({
                name: name,
                uid: uid
            });
            console.log("注册了对象："+name+":"+uid)
        }
        
    }//注册final_output对象
    
    //等待1秒后根据default_pipe.list注册管道
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pipe_list_path = path.join(__dirname, 'default_pipe.list');
    if(!fs.existsSync(pipe_list_path)){
        console.error('default_pipe.list 文件不存在');
        return;
    }
    //注册converter
    await creat_converter(null,"command_multi_contact_multimedia_message","main_command_converter_in","main_command_converter_out");
    const pipe_list_content = fs.readFileSync(pipe_list_path, 'utf-8');
    const pipe_lines = pipe_list_content.split('\n').filter(line => line.trim() !== '');
    for(const line of pipe_lines){
        const pipe_config = line.trim();
        if(!pipe_config) continue;
        const [source_name, output_name] = pipe_config.split(':');
        if(!source_name || !output_name){
            console.error(`管道配置格式错误: ${pipe_config}`);
            continue;
        }
        const output_name_clean = output_name.replace(/\.ts$/, '');
        const result = creat_pipe(source_name, output_name_clean);
        console.log(`注册管道: ${source_name} -> ${output_name_clean}: ${result}`);
    }
}//输入的init需要输入端自己执行以获取uid
export function reg_name(name:string, uid:string):void
{
    uidWithName_pairs.push({name, uid});
}
export function exit_name(uid:string):boolean
{
    return uidWithName_pairs.some(pair => pair.uid === uid);
}
export function find_name_uid(name:string):string
{
    const pair = uidWithName_pairs.find(pair => pair.name === name);
    return pair ? pair.uid : "";
}

export function find_uid_name(uid:string):string
{
    const pair = uidWithName_pairs.find(pair => pair.uid === uid);
    return pair ? pair.name : "";
}

export function format_uid_with_name(uid:string):string
{
    const name = find_uid_name(uid);
    return name ? `${uid}(${name})` : uid;
}

export interface ComponentInfo {
    found: boolean;
    type: 'source' | 'converter' | 'final_output' | 'pipe' | 'unknown';
    uid: string;
    name: string;
    input_uid?: string;
    input_name?: string;
    output_uid?: string;
    output_name?: string;
    input_type?: string;
    output_type?: string;
    converter_type?: string;
    output_type_name?: string;
}

export function check_component(uid_or_name: string): ComponentInfo
{
    const uid = find_name_uid(uid_or_name) || uid_or_name;
    const name = find_uid_name(uid);

    const source = sources.find(s => s.uid === uid);
    if(source){
        return {
            found: true,
            type: 'source',
            uid: uid,
            name: name,
            input_type: source.type
        };
    }

    const converterByInput = converters.find(c => c.input_uid === uid);
    if(converterByInput){
        return {
            found: true,
            type: 'converter',
            uid: uid,
            name: name,
            input_uid: converterByInput.input_uid,
            input_name: find_uid_name(converterByInput.input_uid),
            output_uid: converterByInput.output_uid,
            output_name: find_uid_name(converterByInput.output_uid),
            input_type: converterByInput.input_type,
            output_type: converterByInput.output_type,
            converter_type: converterByInput.converter_type
        };
    }

    const converterByOutput = converters.find(c => c.output_uid === uid);
    if(converterByOutput){
        return {
            found: true,
            type: 'converter',
            uid: uid,
            name: name,
            input_uid: converterByOutput.input_uid,
            input_name: find_uid_name(converterByOutput.input_uid),
            output_uid: converterByOutput.output_uid,
            output_name: find_uid_name(converterByOutput.output_uid),
            input_type: converterByOutput.input_type,
            output_type: converterByOutput.output_type,
            converter_type: converterByOutput.converter_type
        };
    }

    const finalOutput = final_outputs.find(f => f.interface_uid === uid);
    if(finalOutput){
        return {
            found: true,
            type: 'final_output',
            uid: uid,
            name: name,
            input_type: finalOutput.interface_type,
            output_type_name: finalOutput.output_type
        };
    }

    const pipeByInput = pipes.find(p => p.input_uid === uid);
    if(pipeByInput){
        return {
            found: true,
            type: 'pipe',
            uid: uid,
            name: name,
            input_uid: pipeByInput.input_uid,
            input_name: find_uid_name(pipeByInput.input_uid),
            output_uid: pipeByInput.output_uid,
            output_name: find_uid_name(pipeByInput.output_uid)
        };
    }

    const pipeByOutput = pipes.find(p => p.output_uid === uid);
    if(pipeByOutput){
        return {
            found: true,
            type: 'pipe',
            uid: uid,
            name: name,
            input_uid: pipeByOutput.input_uid,
            input_name: find_uid_name(pipeByOutput.input_uid),
            output_uid: pipeByOutput.output_uid,
            output_name: find_uid_name(pipeByOutput.output_uid)
        };
    }

    return {
        found: false,
        type: 'unknown',
        uid: uid,
        name: name
    };
}

export interface AllComponentsInfo {
    pipes: { input_uid: string; input_name: string; input_type: string; output_uid: string; output_name: string; output_type: string; formatted: string }[];
    sources: { uid: string; name: string; type: string; formatted: string }[];
    converters: { input_uid: string; input_name: string; output_uid: string; output_name: string; input_type: string; output_type: string; converter_type: string; formatted: string }[];
    final_outputs: { uid: string; name: string; interface_type: string; output_type: string; formatted: string }[];
}

export function list_all_components(): AllComponentsInfo
{
    const pipesInfo = pipes.map(p => {
        const inputInfo = check_component(p.input_uid);
        const outputInfo = check_component(p.output_uid);
        return {
            input_uid: p.input_uid,
            input_name: find_uid_name(p.input_uid),
            input_type: inputInfo.input_type || inputInfo.output_type || '',
            output_uid: p.output_uid,
            output_name: find_uid_name(p.output_uid),
            output_type: outputInfo.input_type || outputInfo.output_type || '',
            formatted: `${format_uid_with_name(p.input_uid)} -> ${format_uid_with_name(p.output_uid)}`
        };
    });

    const sourcesInfo = sources.map(s => ({
        uid: s.uid,
        name: find_uid_name(s.uid),
        type: s.type,
        formatted: format_uid_with_name(s.uid)
    }));

    const convertersInfo = converters.map(c => ({
        input_uid: c.input_uid,
        input_name: find_uid_name(c.input_uid),
        output_uid: c.output_uid,
        output_name: find_uid_name(c.output_uid),
        input_type: c.input_type,
        output_type: c.output_type,
        converter_type: c.converter_type,
        formatted: `${format_uid_with_name(c.input_uid)} -> [${c.converter_type}] -> ${format_uid_with_name(c.output_uid)}`
    }));

    const finalOutputsInfo = final_outputs.map(f => ({
        uid: f.interface_uid,
        name: find_uid_name(f.interface_uid),
        interface_type: f.interface_type,
        output_type: f.output_type,
        formatted: format_uid_with_name(f.interface_uid)
    }));

    return {
        pipes: pipesInfo,
        sources: sourcesInfo,
        converters: convertersInfo,
        final_outputs: finalOutputsInfo
    };
}
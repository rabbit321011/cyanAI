//先定义相关的类
import path from 'path';
import fs from 'fs';
import { 
    erogenous_point, 
    theory, 
    build_theory, 
    struct_theory, 
    persuade_theory 
} from './data_structure/theory_types';
import { get_id } from '../../utility/time/get_id';
import { weight_key } from '../../types/data/data.type';
import { checkPyServer } from '../../utility/connect/connect';
import { reranker } from '../../utility/reranker/reranker';
import { readIni } from '../../utility/file_operation/read_ini';
const default_activation_threshold = 0.7;//这个值是应用到所有类型的theory上的
class erogenous_entity implements erogenous_point{
    public name: string;//激活词
    public uid: string;
    public parents: weight_key;//这个才是关键点，其实只有一个
    public source_activation: number[];//没事别碰
    public final_activation: number;//放心取，不要改

    constructor(name: string) {
        this.name = name;
        this.uid = get_id();
        this.parents = {
            weight:0,
            key:""
        };//默认为这样的空
        this.source_activation = new Array(10).fill(0);
        this.final_activation = 0;
    }

    public push_activation(input:number):void
    {
        this.source_activation.shift();
        this.source_activation.push(input);
        let sum = 0;
        for (let i = 0; i < this.source_activation.length; i++) {
            sum += this.source_activation[i] * (1 - i * 0.1);
        }
        this.final_activation = Math.max(0, sum);
    }
    
    public async activation(input:weight_key[]):Promise<number>{
        if(input.length === 0) return 0;
        
        if((await checkPyServer()).success === true)
        {
            const maxBatch = 32;
            let weight_response = 0;
            
            for(let i = 0; i < input.length; i += maxBatch) {
                const batch = input.slice(i, i + maxBatch);
                const temp_string = batch.map((curr) => curr.key);
                
                try {
                    const temp_out = await reranker(this.name, temp_string);
                    for(let j = 0; j < temp_out.length; j++) {
                        weight_response += batch[j].weight * temp_out[j];
                    }
                } catch {
                    return 0;
                }
            }
            return weight_response;
        }else
        {
            console.error("连接py服务器失败,无法使用")
            return 0;
        }
    }//输入带权总和文本，不拆分，返回总激活值，依赖reranker服务。
    
}//激活最终还是靠theory,这个类就计算一下
const activation_threshold_step_up = 0.005;
const activation_threshold_step_down = 0.075;//被否定降的就快
const decay_rate = 0.917;//半衰期是7，因为0.917^8 = 1/2
class build_theory_entity implements build_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: weight_key[];
    public activation_threshold: number;
    public activation_threshold_correction: number;//阈值上升梯度是0.0
    public sub_struct_uid: string;
    public text: string;
    public base_theory_uid: string[];

    constructor(name: string, subStructUid: string, text: string) {
        this.name = name;
        this.uid = get_id();
        this.sub_erogenous_point = [];
        this.activation_threshold = default_activation_threshold;
        this.activation_threshold_correction = 0;
        this.sub_struct_uid = subStructUid;
        this.text = text;
        this.base_theory_uid = [];
    }
    public async try_activation(input:weight_key[]):Promise<boolean>{
        //根据输入的文本一次激活子动情点的reranker
        
        //如果成功被激活，而且LLM评审也过了，那么子动情点的weight上升(这个上升依赖其本身的reranker激活值,整体来说是*e^reranker)
        //如果激活失败，则什么也不做
        //如果激活但是LLM评审没过，那么子动情点的weight下降(下降也依赖本身的reranker激活词)
        
        this.sub_erogenous_point.map((curr,index)=>{
            curr.key
        })//先尝试激活，看看激活的结果怎么样
        return false;
    }//返回本理论是否被成功激活
    
}

class struct_theory_entity implements struct_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: weight_key[];
    public activation_threshold: number;
    public activation_threshold_correction: number;
    public parent_build_uid: string;
    public sub_persuade_uid: string[];
    public text: string;
    public base_theory_uid: string[];

    constructor(name: string, text: string) {
        this.name = name;
        this.uid = get_id();
        this.sub_erogenous_point = [];
        this.activation_threshold = default_activation_threshold;
        this.activation_threshold_correction = 0;
        this.parent_build_uid = "";
        this.sub_persuade_uid = [];
        this.text = text;
        this.base_theory_uid = [];
    }
}

class persuade_theory_entity implements persuade_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: weight_key[];
    public activation_threshold: number;
    public activation_threshold_correction: number;
    public parent_struct_uid: string;
    public text: string;
    public base_theory_uid: string[];

    constructor(name: string, text: string) {
        this.name = name;
        this.uid = get_id();
        this.sub_erogenous_point = [];
        this.activation_threshold = default_activation_threshold;
        this.activation_threshold_correction = 0;
        this.parent_struct_uid = "";
        this.text = text;
        this.base_theory_uid = [];
    }
}
//theory的载入相关
let theory_datas:{
    build:build_theory_entity[],
    struct:struct_theory_entity[],
    persuade:persuade_theory_entity[]
} = {
    build:[],
    struct:[],
    persuade:[]
}
const THEORY_DB_PATH = readIni(path.join(__dirname, '../../../library_source.ini'), 'theory_file');
export function load_theory_datas():void{
    try{
        const buildPath = path.join(THEORY_DB_PATH, 'build.json');
        const structPath = path.join(THEORY_DB_PATH, 'struct.json');
        const persuadePath = path.join(THEORY_DB_PATH, 'persuade.json');
        
        if(fs.existsSync(buildPath)){
            const buildData = fs.readFileSync(buildPath, 'utf-8');
            theory_datas.build = JSON.parse(buildData);
        }
        if(fs.existsSync(structPath)){
            const structData = fs.readFileSync(structPath, 'utf-8');
            theory_datas.struct = JSON.parse(structData);
        }
        if(fs.existsSync(persuadePath)){
            const persuadeData = fs.readFileSync(persuadePath, 'utf-8');
            theory_datas.persuade = JSON.parse(persuadeData);
        }
    }catch(error){
        console.error('加载theory数据失败:', error);
    }
}//从文件载入
export function save_theory_datas():void{
    try{
        const buildPath = path.join(THEORY_DB_PATH, 'build.json');
        const structPath = path.join(THEORY_DB_PATH, 'struct.json');
        const persuadePath = path.join(THEORY_DB_PATH, 'persuade.json');
        
        fs.writeFileSync(buildPath, JSON.stringify(theory_datas.build, null, 2));
        fs.writeFileSync(structPath, JSON.stringify(theory_datas.struct, null, 2));
        fs.writeFileSync(persuadePath, JSON.stringify(theory_datas.persuade, null, 2));
    }catch(error){
        console.error('保存theory数据失败:', error);
    }
}//把当前值保存到文件
//动情点的载入
let erogenous_entitys:erogenous_entity[] = [];
const EROGENOUS_POINTS_PATH = path.join(THEORY_DB_PATH, 'erogenous_points');
export function load_erogenous_entitys():void{
    try{
        const erogenousPath = path.join(EROGENOUS_POINTS_PATH, 'erogenous_points.json');
        if(fs.existsSync(erogenousPath)){
            const erogenousData = fs.readFileSync(erogenousPath, 'utf-8');
            erogenous_entitys = JSON.parse(erogenousData);
        }
    }catch(error){
        console.error('加载动情点数据失败:', error);
    }
}//从文件载入动情点

export function get_erogenous_entity_by_uid(uid:string):erogenous_entity|undefined{
    return erogenous_entitys.find(entity => entity.uid === uid);
}

export function save_erogenous_entitys():void{
    try{
        const erogenousPath = path.join(EROGENOUS_POINTS_PATH, 'erogenous_points.json');
        fs.writeFileSync(erogenousPath, JSON.stringify(erogenous_entitys, null, 2));
    }catch(error){
        console.error('保存动情点数据失败:', error);
    }
}//保存动情点到文件

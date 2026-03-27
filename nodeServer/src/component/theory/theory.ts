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
const default_activation_threshold = 0.3;//这个值是应用到所有类型的theory上的
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
const activation_threshold_step_up = 0.005;//被肯定则阈值下降，更容易触发
const activation_threshold_step_down = 0.075;//被否定降的就快(这其实是阈值提升了)
const activation_threshold_correction_up = 0.07;//被否定时会下降
const activation_threshold_correction_down = 0.007;
const decay_rate_success = 0.917;//半衰期是7，因为0.917^8 = 1/2
const decay_rate_fail = 0.954;//半衰期是15
interface theory_reback{
    activation:boolean;
    v:(review_result: boolean) => void;
}//理论回执
class build_theory_entity implements build_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: string[];
    public activation_threshold: number;
    public activation_threshold_correction: number;
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

    public bind_erogenous_point(target_uid: string, newWeightRatio?: number): boolean {
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (!targetEntity) {
            return false;
        }
        if (this.sub_erogenous_point.includes(target_uid)) {
            return false;
        }
        const newWeight = newWeightRatio ?? (1 / (this.sub_erogenous_point.length + 1));
        const scaleFactor = 1 - newWeight;
        for (const uid of this.sub_erogenous_point) {
            const entity = get_erogenous_entity_by_uid(uid);
            if (entity) {
                entity.parents.weight *= scaleFactor;
            }
        }
        targetEntity.parents = {
            weight: newWeight,
            key: this.uid
        };
        this.sub_erogenous_point.push(target_uid);
        return true;
    }//使新的权重占比有newWeightRatio,若想让其他权重的激活效果不变，则activation_threshold应该*=1-newWeightRatio
    //newWeightRatio默认为1 / (this.sub_erogenous_point.length + 1)
    public unbind_erogenous_point(target_uid: string): boolean {
        const index = this.sub_erogenous_point.indexOf(target_uid);
        if (index === -1) {
            return false;
        }
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (targetEntity && targetEntity.parents.key === this.uid) {
            const removedWeight = targetEntity.parents.weight;
            const remainingSum = 1 - removedWeight;
            if (remainingSum > 0) {
                for (const uid of this.sub_erogenous_point) {
                    if (uid === target_uid) continue;
                    const entity = get_erogenous_entity_by_uid(uid);
                    if (entity) {
                        entity.parents.weight /= remainingSum;
                    }
                }
            }
            targetEntity.parents = {
                weight: 0,
                key: ""
            };
        }
        this.sub_erogenous_point.splice(index, 1);
        return true;
    }//解绑后剩余权重归一化，若想让其他权重的激活效果不变，则activation_threshold应该*=1-removedWeight
    //removedWeight为被解绑动情点的原权重
    
    public async try_activation(input:weight_key[]):Promise<theory_reback>{
        //根据输入的文本一次激活子动情点的reranker
        this.activation_threshold_correction -= activation_threshold_correction_down;//既然尝试激活了，那么就下降临时窗口一次
        if(this.activation_threshold_correction < 0)
            this.activation_threshold_correction = 0;
        //如果成功被激活，而且LLM评审也过了，那么子动情点的weight上升(这个上升依赖其本身的reranker激活值,整体来说是*e^reranker)
        //如果激活失败，则什么也不做
        //如果激活但是LLM评审没过，那么子动情点的weight下降(下降也依赖本身的reranker激活词)
        let result = 0;
        let final_weights:number[] =[]
        for(const curr of this.sub_erogenous_point){
            const now_node = get_erogenous_entity_by_uid(curr);
            if(now_node){
                let temp_source_weights = await now_node.activation(input);
                now_node.push_activation(temp_source_weights)
                let temp_weights = (temp_source_weights/2 + now_node.final_activation/11) * now_node.parents.weight;
                result += temp_weights;
                final_weights.push(temp_weights)
            }
        }
        if(this.activation_threshold + this.activation_threshold_correction < result)
        {
            return {
                activation:true,
                v:((review_result:boolean)=>{
                    if(review_result)
                    {
                        //激活成功，将当前激活权重设为目标权重渐进靠近
                        this.rate_weight_correction(final_weights,decay_rate_success);
                        this.activation_threshold -= activation_threshold_step_up;
                        this.activation_threshold_correction = 0;

                    }else
                    {
                        //激活失败，将算出平均化权重后设为目标权重渐进靠近
                        //即每个权重是一样的，都为1/动情点数量
                        const avg_weight = 1 / this.sub_erogenous_point.length;
                        const aim_weights = new Array(this.sub_erogenous_point.length).fill(avg_weight);
                        this.rate_weight_correction(aim_weights, decay_rate_fail);
                        this.activation_threshold += activation_threshold_step_down;
                        this.activation_threshold_correction += activation_threshold_correction_up;
                        
                    }
                })
            };
        }else
        {
            return {
                activation:false,
                v:((review_result:boolean)=>{})
            };//激活失败
        }
    }//返回本理论是否被成功激活
    public rate_weight_correction(aim_weight:number[],speed_rate:number)
    {
        if(aim_weight.length !== this.sub_erogenous_point.length)
            {
                console.error("在修正theory和其动情点权重时,权重维度不相等!");
                return;//数量不对
            }
        //先计算偏差数组
        let temp_weights:number[] = [];
        let temp_weights_uid:string[] = [];
        for(const curr of this.sub_erogenous_point){
            const entity = get_erogenous_entity_by_uid(curr);
            if(!entity){
                console.error(`找不到动情点，uid: ${curr}`);
                return;
            }
            temp_weights.push(entity.parents.weight);
            temp_weights_uid.push(curr);
        }
        //现在temp_weights是临时的拷贝了
        let temp_dec_weight:number[] = []
        temp_weights.map((curr,index)=>{
            temp_dec_weight.push(aim_weight[index] - curr)
        })
        //rate化
        temp_dec_weight = temp_dec_weight.map((curr)=>{
            return curr * (1 - speed_rate)
        })
        //加上去
        temp_weights = temp_weights.map((curr,index)=>{
            return curr + temp_dec_weight[index];
        })
        //归一化，让temp_weight的总和为1
        const sum = temp_weights.reduce((acc, curr) => acc + curr, 0);
        if(sum !== 0){
            temp_weights = temp_weights.map(curr => curr / sum);
        }
        //将归一化后的权重写回erogenous_entity
        for(let i = 0; i < temp_weights.length; i++){
            const entity = get_erogenous_entity_by_uid(temp_weights_uid[i]);
            if(entity){
                entity.parents.weight = temp_weights[i];
            }
        }
    }//通过rate和aim修正权重
}

class struct_theory_entity implements struct_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: string[];
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

    public bind_erogenous_point(target_uid: string, newWeightRatio?: number): boolean {
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (!targetEntity) {
            return false;
        }
        if (this.sub_erogenous_point.includes(target_uid)) {
            return false;
        }
        const newWeight = newWeightRatio ?? (1 / (this.sub_erogenous_point.length + 1));
        const scaleFactor = 1 - newWeight;
        for (const uid of this.sub_erogenous_point) {
            const entity = get_erogenous_entity_by_uid(uid);
            if (entity) {
                entity.parents.weight *= scaleFactor;
            }
        }
        targetEntity.parents = {
            weight: newWeight,
            key: this.uid
        };
        this.sub_erogenous_point.push(target_uid);
        return true;
    }//使新的权重占比有newWeightRatio,若想让其他权重的激活效果不变，则activation_threshold应该*=1-newWeightRatio
    //newWeightRatio默认为1 / (this.sub_erogenous_point.length + 1)

    public unbind_erogenous_point(target_uid: string): boolean {
        const index = this.sub_erogenous_point.indexOf(target_uid);
        if (index === -1) {
            return false;
        }
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (targetEntity && targetEntity.parents.key === this.uid) {
            const removedWeight = targetEntity.parents.weight;
            const remainingSum = 1 - removedWeight;
            if (remainingSum > 0) {
                for (const uid of this.sub_erogenous_point) {
                    if (uid === target_uid) continue;
                    const entity = get_erogenous_entity_by_uid(uid);
                    if (entity) {
                        entity.parents.weight /= remainingSum;
                    }
                }
            }
            targetEntity.parents = {
                weight: 0,
                key: ""
            };
        }
        this.sub_erogenous_point.splice(index, 1);
        return true;
    }//解绑后剩余权重归一化，若想让其他权重的激活效果不变，则activation_threshold应该*=1-removedWeight
    //removedWeight为被解绑动情点的原权重

    public async try_activation(input:weight_key[]):Promise<theory_reback>{
        this.activation_threshold_correction -= activation_threshold_correction_down;
        if(this.activation_threshold_correction < 0)
            this.activation_threshold_correction = 0;
        let result = 0;
        let final_weights:number[] =[]
        for(const curr of this.sub_erogenous_point){
            const now_node = get_erogenous_entity_by_uid(curr);
            if(now_node){
                let temp_weights = await now_node.activation(input) * now_node.parents.weight;
                result += temp_weights;
                final_weights.push(temp_weights)
            }
        }
        if(this.activation_threshold + this.activation_threshold_correction < result)
        {
            return {
                activation:true,
                v:((review_result:boolean)=>{
                    if(review_result)
                    {
                        this.rate_weight_correction(final_weights,decay_rate_success);
                        this.activation_threshold -= activation_threshold_step_up;
                        this.activation_threshold_correction = 0;
                    }else
                    {
                        const avg_weight = 1 / this.sub_erogenous_point.length;
                        const aim_weights = new Array(this.sub_erogenous_point.length).fill(avg_weight);
                        this.rate_weight_correction(aim_weights, decay_rate_fail);
                        this.activation_threshold += activation_threshold_step_down;
                        this.activation_threshold_correction += activation_threshold_correction_up;
                    }
                })
            };
        }else
        {
            return {
                activation:false,
                v:((review_result:boolean)=>{})
            };
        }
    }
    public rate_weight_correction(aim_weight:number[],speed_rate:number)
    {
        if(aim_weight.length !== this.sub_erogenous_point.length)
            {
                console.error("在修正theory和其动情点权重时,权重维度不相等!");
                return;
            }
        let temp_weights:number[] = [];
        let temp_weights_uid:string[] = [];
        for(const curr of this.sub_erogenous_point){
            const entity = get_erogenous_entity_by_uid(curr);
            if(!entity){
                console.error(`找不到动情点，uid: ${curr}`);
                return;
            }
            temp_weights.push(entity.parents.weight);
            temp_weights_uid.push(curr);
        }
        let temp_dec_weight:number[] = []
        temp_weights.map((curr,index)=>{
            temp_dec_weight.push(aim_weight[index] - curr)
        })
        temp_dec_weight = temp_dec_weight.map((curr)=>{
            return curr * (1 - speed_rate)
        })
        temp_weights = temp_weights.map((curr,index)=>{
            return curr + temp_dec_weight[index];
        })
        const sum = temp_weights.reduce((acc, curr) => acc + curr, 0);
        if(sum !== 0){
            temp_weights = temp_weights.map(curr => curr / sum);
        }
        for(let i = 0; i < temp_weights.length; i++){
            const entity = get_erogenous_entity_by_uid(temp_weights_uid[i]);
            if(entity){
                entity.parents.weight = temp_weights[i];
            }
        }
    }
}

class persuade_theory_entity implements persuade_theory{
    public name: string;
    public uid: string;
    public sub_erogenous_point: string[];
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

    public bind_erogenous_point(target_uid: string, newWeightRatio?: number): boolean {
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (!targetEntity) {
            return false;
        }
        if (this.sub_erogenous_point.includes(target_uid)) {
            return false;
        }
        const newWeight = newWeightRatio ?? (1 / (this.sub_erogenous_point.length + 1));
        const scaleFactor = 1 - newWeight;
        for (const uid of this.sub_erogenous_point) {
            const entity = get_erogenous_entity_by_uid(uid);
            if (entity) {
                entity.parents.weight *= scaleFactor;
            }
        }
        targetEntity.parents = {
            weight: newWeight,
            key: this.uid
        };
        this.sub_erogenous_point.push(target_uid);
        return true;
    }//使新的权重占比有newWeightRatio,若想让其他权重的激活效果不变，则activation_threshold应该*=1-newWeightRatio
    //newWeightRatio默认为1 / (this.sub_erogenous_point.length + 1)

    public unbind_erogenous_point(target_uid: string): boolean {
        const index = this.sub_erogenous_point.indexOf(target_uid);
        if (index === -1) {
            return false;
        }
        const targetEntity = get_erogenous_entity_by_uid(target_uid);
        if (targetEntity && targetEntity.parents.key === this.uid) {
            const removedWeight = targetEntity.parents.weight;
            const remainingSum = 1 - removedWeight;
            if (remainingSum > 0) {
                for (const uid of this.sub_erogenous_point) {
                    if (uid === target_uid) continue;
                    const entity = get_erogenous_entity_by_uid(uid);
                    if (entity) {
                        entity.parents.weight /= remainingSum;
                    }
                }
            }
            targetEntity.parents = {
                weight: 0,
                key: ""
            };
        }
        this.sub_erogenous_point.splice(index, 1);
        return true;
    }//解绑后剩余权重归一化，若想让其他权重的激活效果不变，则activation_threshold应该*=1-removedWeight
    //removedWeight为被解绑动情点的原权重

    public async try_activation(input:weight_key[]):Promise<theory_reback>{
        this.activation_threshold_correction -= activation_threshold_correction_down;
        if(this.activation_threshold_correction < 0)
            this.activation_threshold_correction = 0;
        let result = 0;
        let final_weights:number[] =[]
        for(const curr of this.sub_erogenous_point){
            const now_node = get_erogenous_entity_by_uid(curr);
            if(now_node){
                let temp_weights = await now_node.activation(input) * now_node.parents.weight;
                result += temp_weights;
                final_weights.push(temp_weights)
            }
        }
        if(this.activation_threshold + this.activation_threshold_correction < result)
        {
            return {
                activation:true,
                v:((review_result:boolean)=>{
                    if(review_result)
                    {
                        this.rate_weight_correction(final_weights,decay_rate_success);
                        this.activation_threshold -= activation_threshold_step_up;
                        this.activation_threshold_correction = 0;
                    }else
                    {
                        const avg_weight = 1 / this.sub_erogenous_point.length;
                        const aim_weights = new Array(this.sub_erogenous_point.length).fill(avg_weight);
                        this.rate_weight_correction(aim_weights, decay_rate_fail);
                        this.activation_threshold += activation_threshold_step_down;
                        this.activation_threshold_correction += activation_threshold_correction_up;
                    }
                })
            };
        }else
        {
            return {
                activation:false,
                v:((review_result:boolean)=>{})
            };
        }
    }
    public rate_weight_correction(aim_weight:number[],speed_rate:number)
    {
        if(aim_weight.length !== this.sub_erogenous_point.length)
            {
                console.error("在修正theory和其动情点权重时,权重维度不相等!");
                return;
            }
        let temp_weights:number[] = [];
        let temp_weights_uid:string[] = [];
        for(const curr of this.sub_erogenous_point){
            const entity = get_erogenous_entity_by_uid(curr);
            if(!entity){
                console.error(`找不到动情点，uid: ${curr}`);
                return;
            }
            temp_weights.push(entity.parents.weight);
            temp_weights_uid.push(curr);
        }
        let temp_dec_weight:number[] = []
        temp_weights.map((curr,index)=>{
            temp_dec_weight.push(aim_weight[index] - curr)
        })
        temp_dec_weight = temp_dec_weight.map((curr)=>{
            return curr * (1 - speed_rate)
        })
        temp_weights = temp_weights.map((curr,index)=>{
            return curr + temp_dec_weight[index];
        })
        const sum = temp_weights.reduce((acc, curr) => acc + curr, 0);
        if(sum !== 0){
            temp_weights = temp_weights.map(curr => curr / sum);
        }
        for(let i = 0; i < temp_weights.length; i++){
            const entity = get_erogenous_entity_by_uid(temp_weights_uid[i]);
            if(entity){
                entity.parents.weight = temp_weights[i];
            }
        }
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
            const buildData = JSON.parse(fs.readFileSync(buildPath, 'utf-8'));
            theory_datas.build = buildData.map((data: any) => {
                const entity = new build_theory_entity(data.name, data.sub_struct_uid, data.text);
                Object.assign(entity, data);
                return entity;
            });
        }
        if(fs.existsSync(structPath)){
            const structData = JSON.parse(fs.readFileSync(structPath, 'utf-8'));
            theory_datas.struct = structData.map((data: any) => {
                const entity = new struct_theory_entity(data.name, data.text);
                Object.assign(entity, data);
                return entity;
            });
        }
        if(fs.existsSync(persuadePath)){
            const persuadeData = JSON.parse(fs.readFileSync(persuadePath, 'utf-8'));
            theory_datas.persuade = persuadeData.map((data: any) => {
                const entity = new persuade_theory_entity(data.name, data.text);
                Object.assign(entity, data);
                return entity;
            });
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
            const erogenousData = JSON.parse(fs.readFileSync(erogenousPath, 'utf-8'));
            erogenous_entitys = erogenousData.map((data: any) => {
                const entity = new erogenous_entity(data.name);
                entity.uid = data.uid;
                entity.parents = data.parents;
                entity.source_activation = data.source_activation;
                entity.final_activation = data.final_activation;
                return entity;
            });
        }
    }catch(error){
        console.error('加载动情点数据失败:', error);
    }
}//从文件载入动情点
load_erogenous_entitys();
console.log("共载入"+erogenous_entitys.length.toString()+"个erogenous_entitys");
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

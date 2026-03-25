export interface weight_key{
    weight:number,
    key:string
}
import { now,sub } from "../../utility/time/cyan_time";
class memory_status{
    public last_day:string = "";//△t,通过cyan_time来运算
    public session_uid:string = "";

    public S:number = 0.2;//记忆稳定性
    public a:number = 15;//增益倍数

    constructor(S:number, a:number, now_day:string, session_uid:string){
        this.S = S;
        this.a = a;
        this.last_day = now_day;
        this.session_uid = session_uid;
    }
    public get_R(now_day:string):number
    {
        const dayDiff = parseFloat(sub(now_day,this.last_day).replace('d',''));
        return Math.pow(0.9, dayDiff/this.S);
    }
    public consolidate(now_day:string,now_session_uid:string,D:number = 0):boolean{
        if((now_session_uid !== this.session_uid)&&(parseFloat(sub(now_day,this.last_day).replace('d','')) > 1))
        {
            this.S *= (1 + this.a * Math.exp(-D) * (1 - this.get_R(now_day)));
            this.last_day = now_day;
            this.session_uid = now_session_uid;
            return true;
        }
        else
            return false;//不能复习
    }//复习函数
    
}//记忆状态类，提供检验记忆权重和复习两个方法
//一次对话且同一天的时候是不能复习的
//

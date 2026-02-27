import { Request, Response } from "express";
import { CyanMainService } from "../services/cyan.service";
//import {  } from "../types/web/web.type";

const cyanMainService = new CyanMainService();

export class CyanController{
  async controller_exit_status(req:Request,res:Response)
  {//压根不用body,返回{result:结果布尔值}
    try{
      //这个请求返回结果就行
      res.json({
        result:await cyanMainService.service_exit_status()
      })
    }catch(error)
    {
      console.error(error)
      res.status(500).json({error:"服务器出错了"})
    }
  }//检测status是否存在
  async controller_send_message(req:Request,res:Response)
  {//这玩意的body需要是{current,user_name},返回{result:"结果字符串"}
    try{
        const body = req.body;
        if (!body || !body.current || !body.user_name) {
        // 400 Bad Request: 你请求有问题
        res.status(400).json({ error: "参数错误: 必须包含 current 和 user_name 字段" });
        return; 
        }
      
        res.json({
            result:await cyanMainService.service_send_message(body.current,body.user_name)
        })
    }catch(error)
    {
      console.error(error)
      res.status(500).json({error:"服务器出错了"})
    }
  }//发送信息
  async controller_close_event(req:Request,res:Response)
  {
    try{
      //这个请求返回结果就行
      res.json({
        result:await cyanMainService.service_close_event()
      })
    }catch(error)
    {
      console.error(error)
      res.status(500).json({error:"服务器出错了"})
    }
  }
  async controller_send_test_message(req:Request,res:Response)
  {//这玩意的body需要是{current,user_name},返回{result:"结果字符串"}
    try{
        const body = req.body;
        if (!body || !body.current || !body.user_name) {
        // 400 Bad Request: 你请求有问题
        res.status(400).json({ error: "参数错误: 必须包含 current 和 user_name 字段" });
        return; 
        }
      
        res.json({
            result:await cyanMainService.service_send_test_message(body.current,body.user_name)
        })
    }catch(error)
    {
      console.error(error)
      res.status(500).json({error:"服务器出错了"})
    }
  }//发送测试信息
}
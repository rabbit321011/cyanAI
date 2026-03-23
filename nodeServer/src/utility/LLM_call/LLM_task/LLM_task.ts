import { callDeepSeekLLM, DeepSeekRequest } from "../deepseek_call"
import { readIni } from "../../file_operation/read_ini"
import * as fs from "fs"
import * as path from "path"

export interface LLMResult {
  text: string;
  reasoning?: string;
}

export async function LLM_task_single_deepseek(
  task_demand: string,
  task_data: string,
  temperature: number = 0,
  top_p: number = 0.01,
  model: string = 'deepseek-chat'
): Promise<string> {
  const result = await LLM_task_single_deepseek_full(task_demand, task_data, temperature, top_p, model)
  return result.text
}

// 完整版本，支持返回思考过程
export async function LLM_task_single_deepseek_full(
  task_demand: string,
  task_data: string,
  temperature: number = 0,
  top_p: number = 0.01,
  model: string = 'deepseek-chat'
): Promise<LLMResult> {
  const promptPath = path.join(__dirname, './default_task_prompt.txt')
  const iniPath = path.join(__dirname, '../../../../library_source.ini')

  const promptContent = fs.readFileSync(promptPath, 'utf-8')
  const systemMessage = promptContent + "\n任务要求如下：" + task_demand + "\n任务材料如下：" + task_data

  const apiKey = readIni(iniPath, 'deepseek_api_sky')

  const request: DeepSeekRequest = {
    messages: [
      {
        role: 'system',
        content: systemMessage
      }
    ],
    temperature: temperature,
    top_p: top_p
  }

  const resultRaw = await callDeepSeekLLM(request, apiKey, model)
  return {
    text: resultRaw.text,
    reasoning: resultRaw.reasoning
  }
}

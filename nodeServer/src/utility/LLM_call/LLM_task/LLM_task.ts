import { callDeepSeekLLM, DeepSeekRequest } from "../deepseek_call"
import { readIni } from "../../file_operation/read_ini"
import * as fs from "fs"
import * as path from "path"

export async function LLM_task_single_deepseek(
  task_demand: string,
  task_data: string
): Promise<string> {
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
    ]
  }

  const result = await callDeepSeekLLM(request, apiKey, 'deepseek-chat')
  return result.text
}

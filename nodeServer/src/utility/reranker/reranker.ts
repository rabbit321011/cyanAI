/**
 * Reranker (重排序) 工具模块
 *
 * 提供与 Python RAG 服务交互的重排序功能：
 * - 根据查询文本对多个目标文本进行相关性评分
 * - 返回每个目标文本与查询的相关度分数 (0-1)
 *
 * Python 服务需提供以下 API:
 * - POST /rag/rerank: 重排序评分
 *
 * 服务地址通过 library_source.ini 中的 local_api_url 配置
 */

import { readIni } from '../file_operation/read_ini';
import * as path from 'path';

/** library_source.ini 文件路径 */
const INI_FILE_PATH = path.join(__dirname, '../../library_source.ini');

/** Reranker API 响应类型定义 */
interface RerankerResponse {
    status: string;
    message?: string;
    scores: number[];
}

/**
 * 获取 Python RAG 服务的 API 基础地址
 * @returns API 服务地址，默认为 http://localhost:3723
 */
function getLocalApiUrl(): string {
    const apiUrl = readIni(INI_FILE_PATH, 'local_api_url');
    return apiUrl || 'http://localhost:3723';
}

/**
 * 重排序评分
 * 根据查询文本对目标文本进行相关性评分
 *
 * @param query - 查询文本
 * @param targets - 目标文本数组，待评分的文本列表
 * @returns 相关度分数数组，每个元素对应一个 target 的分数 (0-1)
 *         分数越高表示越相关
 * @throws 如果请求失败或服务返回错误状态
 *
 * @example
 * const scores = await reranker("什么是人工智能？", [
 *     "人工智能是计算机科学的一个分支",
 *     "今天天气很好",
 *     "机器学习是人工智能的一个子领域"
 * ]);
 * console.log(scores); // [0.9998, 0.0001, 0.9852]
 *
 * // 对结果按分数排序
 * const scoredResults = targets
 *     .map((text, index) => ({ text, score: scores[index] }))
 *     .sort((a, b) => b.score - a.score);
 */
export async function reranker(query: string, targets: string[]): Promise<number[]> {
    const baseUrl = getLocalApiUrl();

    const response = await fetch(`${baseUrl}/rag/rerank`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query,
            targets
        })
    });

    const data = await response.json() as RerankerResponse;

    if (data.status !== 'success') {
        throw new Error(`Reranker failed: ${data.message || 'Unknown error'}`);
    }

    return data.scores;
}
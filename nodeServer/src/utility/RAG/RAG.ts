/**
 * RAG (Retrieval-Augmented Generation) 工具模块
 *
 * 提供与 Python RAG 服务交互的功能，包括：
 * - 文本向量化 (embed)
 * - 数据插入 (insert)
 * - Top-K 搜索 (topk)
 * - 清空指定表 (clear_table)
 *
 * Python 服务需提供以下 API:
 * - POST /rag/embed: 文本向量化
 * - POST /rag/insert: 插入数据
 * - POST /rag/search/topk: Top-K 搜索
 * - POST /rag/clear/table: 清空指定表
 *
 * 服务地址通过 library_source.ini 中的 local_api_url 配置
 */

import { readIni } from '../file_operation/read_ini';
import * as path from 'path';

/** library_source.ini 文件路径 */
const INI_FILE_PATH = path.join(__dirname, '../../../library_source.ini');

/** RAG API 响应类型定义 */
interface RagResponse {
    status: string;
    message?: string;
    vector_str?: string;
    results?: string[];
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
 * 文本向量化
 * 将输入文本转换为向量表示
 *
 * @param text - 要向量化的文本
 * @returns 向量字符串，格式为 "[0.012, -0.034, 0.056, ...]"
 * @throws 如果请求失败或服务返回错误状态
 *
 * @example
 * const vector = await embed("要向量化的文本");
 * console.log(vector); // "[0.012, -0.034, 0.056, ...]"
 */
export async function embed(text: string): Promise<string> {
    const baseUrl = getLocalApiUrl();

    const response = await fetch(`${baseUrl}/rag/embed`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
    });

    const data = await response.json() as RagResponse;

    if (data.status !== 'success') {
        throw new Error(`RAG embed failed: ${data.message || 'Unknown error'}`);
    }

    return data.vector_str;
}

/**
 * 插入数据到 RAG 表
 * 向指定表中插入向量化的数据
 *
 * @param table_name - 表名，支持的值: event, theory, object, relationship, temp, chat
 * @param vector_str - 向量字符串，格式为 "[0.012, -0.034, 0.056, ...]"
 * @param data_str - 数据内容，JSON 字符串格式，如 '{"title": "标题", "content": "内容"}'
 * @returns 插入是否成功
 * @throws 如果请求失败或服务返回错误状态
 *
 * @example
 * const vector = await embed("测试内容");
 * await insert("event", vector, JSON.stringify({ title: "事件标题", content: "事件内容" }));
 */
export async function insert(table_name: string, vector_str: string, data_str: string): Promise<boolean> {
    const baseUrl = getLocalApiUrl();

    const response = await fetch(`${baseUrl}/rag/insert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            table_name,
            vector_str,
            data_str
        })
    });

    const data = await response.json() as RagResponse;

    if (data.status !== 'success') {
        throw new Error(`RAG insert failed: ${data.message || 'Unknown error'}`);
    }

    return true;
}

/**
 * Top-K 搜索
 * 根据向量相似度搜索最相似的 K 条数据
 *
 * @param target_dbs - 搜索的目标表名数组，支持的值: event, theory, object, relationship, temp, chat
 * @param vector_str - 查询向量字符串
 * @param k - 返回结果数量，默认为 5
 * @returns 搜索结果数组，每个元素是 JSON 字符串
 * @throws 如果请求失败或服务返回错误状态
 *
 * @example
 * const vector = await embed("搜索关键词");
 * const results = await topk(["event", "theory"], vector, 5);
 * results.forEach(res => {
 *     const data = JSON.parse(res);
 *     console.log(data.title, data.content);
 * });
 */
export async function topk(target_dbs: string[], vector_str: string, k: number = 5): Promise<string[]> {
    const baseUrl = getLocalApiUrl();

    const response = await fetch(`${baseUrl}/rag/search/topk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target_dbs,
            vector_str,
            k
        })
    });

    const data = await response.json() as RagResponse;

    if (data.status !== 'success') {
        throw new Error(`RAG topk search failed: ${data.message || 'Unknown error'}`);
    }

    return data.results;
}

/**
 * 清空指定表
 * 删除指定表中的所有数据
 *
 * @param table_name - 要清空的表名，支持的值: event, theory, object, relationship, temp, chat
 * @returns 清空是否成功
 * @throws 如果请求失败或服务返回错误状态
 *
 * @example
 * await clear_table("temp"); // 清空 temp 表
 */
export async function clear_table(table_name: string): Promise<boolean> {
    const baseUrl = getLocalApiUrl();

    const response = await fetch(`${baseUrl}/rag/clear/table`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ table_name })
    });

    const data = await response.json() as RagResponse;

    if (data.status !== 'success') {
        throw new Error(`RAG clear_table failed: ${data.message || 'Unknown error'}`);
    }

    return true;
}
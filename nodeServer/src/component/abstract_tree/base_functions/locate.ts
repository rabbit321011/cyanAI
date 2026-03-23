/**
 * locate.ts - 抽象树节点定位模块
 */

import { abstruct_node, extra_anaphora_node } from "../data_structure/abstruct_tree_types";
import { LLM_task_single_deepseek, LLM_task_single_deepseek_full } from "../../../utility/LLM_call/LLM_task/LLM_task";
import * as fs from 'fs';
import * as path from 'path';
export function id_locate(node_id: string, source_nodes: abstruct_node[]): abstruct_node {
    for (const node of source_nodes) {
        if (node.id === node_id) {
            return node;
        }
    }
    
    console.error(`未找到节点: ${node_id}，返回空根节点`);
    return {
        id: "root",
        parent_node_id: "root",
        parent_theory_id: ["root"],
        subnodes_id: []
    };
}
const choice_prompt = fs.readFileSync(path.join(__dirname, 'choice_locate_prompt.txt'), 'utf-8');

// DEBUG 开关：开启后返回思考过程
const DEBUG = true;

/**
 * 根据 choice_locate_prompt.txt 的规则定位概念在抽象树中的位置
 * @param target_node 待定位的概念
 * @param source_nodes source_nodes[0] 是父节点，其余是子节点
 * @returns extra_anaphora_node 描述待定位概念与父节点/子节点的关系
 *
 * 关系说明：
 * - self: 待定位概念等于父节点（情况a），需要继续深入查找子节点
 * - multiple_candidate: 待定位概念是某些子节点的抽象（情况b）
 * - undefine_self: 不属于任何现有子节点（情况d）或需要定义新的子节点
 * - bad_struct: 概念结构不清晰，部分属于某子节点部分不属于（情况e）
 */
export async function choice_locate(target_node: string, source_nodes: abstruct_node[]): Promise<extra_anaphora_node> {
    // source_nodes[0] 是父节点，其余是子节点
    // source_nodes 为空时无法定位，返回空字符串标识错误
    if (source_nodes.length === 0) {
        console.error('source_nodes 为空，无法定位');
        return { id: 'root', relation: 'undefine_self' };
    }

    const parentNode = source_nodes[0];
    const childNodes = source_nodes.slice(1);

    // 构造任务数据
    const task_data = `
父节点概念: ${parentNode.id}
子节点概念列表: ${childNodes.map(n => n.id).join(', ')}
待定位概念: ${target_node}
    `.trim();

    try {
        // 调用 LLM 进行定位分析
        let result: string;
        let reasoning: string | undefined;

        if (DEBUG) {
            const fullResult = await LLM_task_single_deepseek_full(
                choice_prompt,
                task_data,
                0,        // temperature
                0.01,     // top_p
                'deepseek-reasoner'  // 使用思考模型
            );
            result = fullResult.text;
            reasoning = fullResult.reasoning;

            console.log(`[choice_locate] 思考过程:\n${reasoning || '无'}\n`);
        } else {
            result = await LLM_task_single_deepseek(
                choice_prompt,
                task_data,
                0,
                0.01,
                'deepseek-reasoner'
            );
        }

        console.log(`[choice_locate] LLM 返回: ${result}`);

        const trimmedResult = result.trim();

        // 解析结果，映射到 extra_anaphora_node
        if (trimmedResult === '-1') {
            // a. 待定位概念是父节点本身，需要继续深入查找子节点
            return {
                id: parentNode.id,
                relation: 'self'
            };
        } else if (trimmedResult === '-2') {
            // d. 待定位概念比父节点具体，但不属于任何子节点
            return {
                id: parentNode.id,
                relation: 'undefine_self'
            };
        } else if (trimmedResult === '-5') {
            // e. 待定位概念被某个子节点部分包含，结构不清晰
            return {
                id: parentNode.id,
                relation: 'bad_struct'
            };
        } else if (trimmedResult.startsWith('{') && trimmedResult.endsWith('}')) {
            // b. 待定位概念是某些子节点的抽象，格式: ${节点1全名，节点2全名}
            const innerContent = trimmedResult.slice(1, -1);
            // 支持全角逗号和半角逗号
            const matchedNodeNames = innerContent.split(/[，,]/).map(s => s.trim()).filter(s => s.length > 0);
            return {
                id: matchedNodeNames,
                relation: 'multiple_candidate'
            };
        } else {
            // c. 待定位概念匹配到某个子节点本身，或者比某子节点更具体
            // 需要继续深入查找，返回匹配到的子节点ID让调用方继续递归
            const matchedChild = childNodes.find(n => n.id === trimmedResult);
            if (matchedChild) {
                // 匹配到子节点，需要继续深入查找该子节点的子节点
                return {
                    id: matchedChild.id,
                    relation: 'self'
                };
            }
            // 如果没找到匹配的子节点，说明比现有所有子节点都更具体，需要定义新子节点
            return {
                id: parentNode.id,
                relation: 'undefine_self'
            };
        }
    } catch (error) {
        console.error('[choice_locate] 调用 LLM 失败:', error);
        return {
            id: parentNode.id,
            relation: 'undefine_self'
        };
    }
}//选择式的定位概念节点
//export async function 
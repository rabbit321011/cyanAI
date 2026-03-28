import { input_for_uid, update_converter_runtime, reg_name, creat_pipe, check_component, list_all_components, format_uid_with_name, ComponentInfo, AllComponentsInfo } from '../pipe';
import { multi_contact_multimedia_message, multi_contact_multimedia_message_array, multimedia_message, inlineData } from '../../../types/process/process.type';
import { runCommand } from '../../route/command';
import { QQsendMessage, QQsendFile } from '../../../utility/QQ/qq';
import { createKey, checkKey, bindKeyToQq, unbindKeyFromQq, verifyQqKey, addToBlacklist, hasPermission } from '../../../utility/key_system/key_manager';
import { getMainStatus, reloadMainStatus } from '../../process/main_virtual';
import { getApiKeyManager } from '../../../utility/error_type/api_key_manager';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RuntimeData {
    queueStaging: boolean;
    messageBuffer: multi_contact_multimedia_message[];
}

function initRuntimeData(): RuntimeData {
    return {
        queueStaging: false,
        messageBuffer: []
    };
}

export function get_interface_type() {
    return {
        input_type: "multi_contact_multimedia_message_array",
        output_type: "multi_contact_multimedia_message_array"
    }
}

function parseMulsetCommand(messageText: string): { command: string; args: string[] } | null {
    if (!messageText.startsWith("^mulset ")) {
        return null;
    }
    const content = messageText.slice(8).trim();
    const parts = content.split(/\s+/);
    const command = parts[0]?.toLowerCase() || '';
    const args = parts.slice(1);
    return { command, args };
}

function getMulsetHelpText(): string {
    return `【mulset 指令帮助】
^mulset queue start - 开启暂存模式
^mulset queue send - 发送暂存消息
^mulset bindkey <KEY> - 绑定KEY
^mulset checkkey [KEY] - 查询KEY信息
^mulset unbindkey - 解除KEY绑定
^mulset creatkey <额度> <权限组> - 创建新KEY（需要op权限）
^mulset addblacklist <QQ号> [原因] - 加入黑名单（需要op权限）
^mulset view status - 查看状态（需要op权限）
^mulset reload - 重置状态（需要op权限）
^mulset reset api_source - 重置API（需要op权限）
^mulset bash <命令> - 执行命令（需要op权限）
^mulset pipe check <name|uid> - 查询组件信息
^mulset pipe reg_name <name> <uid> - 注册别名
^mulset pipe creat_pipe <input> <output> - 创建管道
^mulset pipe list - 列出所有组件
^mulset help - 显示此帮助`;
}

async function handleMulsetCommand(
    command: string,
    args: string[],
    id: string,
    data: RuntimeData,
    output_uid: string,
    output_type: string
): Promise<string | null> {
    switch (command) {
        case 'queue': {
            const subCmd = args[0]?.toLowerCase();
            if (subCmd === 'start') {
                data.queueStaging = true;
                update_converter_runtime(output_uid, data);
                return 'SUCCESS:暂存模式已开启，发送的消息将被暂存';
            } else if (subCmd === 'send') {
                data.queueStaging = false;
                const buffer = data.messageBuffer;
                data.messageBuffer = [];
                update_converter_runtime(output_uid, data);
                
                if (buffer.length === 0) {
                    return 'SUCCESS:暂存区为空，无消息发送';
                }
                
                const result: multi_contact_multimedia_message_array = {
                    messages: buffer
                };
                await input_for_uid(output_uid, result, output_type);
                return null;
            } else {
                return 'ERROR:未知的 queue 子命令\n' + getMulsetHelpText();
            }
        }

        case 'bindkey': {
            if (args.length < 1) {
                return 'ERROR:用法: ^mulset bindkey <KEY>';
            }
            const key = args[0];
            const result = bindKeyToQq(id, key);
            if (result.success) {
                return `SUCCESS:KEY绑定成功\n你已绑定KEY: ${key}`;
            } else {
                return `ERROR:${result.error}`;
            }
        }

        case 'checkkey': {
            let keyToCheck: string | null = null;
            if (args.length > 0) {
                keyToCheck = args[0];
            } else {
                const verifyResult = verifyQqKey(id);
                if (!verifyResult.key) {
                    return 'ERROR:你当前未绑定KEY';
                }
                keyToCheck = verifyResult.key.key;
            }
            const keyRecord = checkKey(keyToCheck);
            if (!keyRecord) {
                return `ERROR:KEY "${keyToCheck}" 不存在`;
            }
            const quotaDisplay = keyRecord.quota === 'inf' ? '无限' : String(keyRecord.quota);
            const totalDisplay = keyRecord.total_quota === 'inf' ? '无限' : String(keyRecord.total_quota);
            const usedDisplay = keyRecord.total_quota === 'inf' ? '无限' :
                String((keyRecord.total_quota as number) - (keyRecord.quota as number));
            return `KEY信息:\nKEY: ${keyRecord.key}\n权限组: ${keyRecord.permission}\n剩余额度: ${quotaDisplay}\n已用额度: ${usedDisplay}\n总额度: ${totalDisplay}\n创建者: ${keyRecord.creator_qq}\n创建时间: ${keyRecord.created_at}`;
        }

        case 'unbindkey': {
            const result = unbindKeyFromQq(id);
            if (result.success) {
                return 'SUCCESS:KEY已解除绑定';
            } else {
                return `ERROR:${result.error}`;
            }
        }

        case 'creatkey': {
            if (args.length < 2) {
                return 'ERROR:用法: ^mulset creatkey <额度> <权限组>\n额度: 正整数或"inf"\n权限组: admin, op, user, visitor';
            }
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            const quotaStr = args[0];
            const permissionStr = args[1] as 'admin' | 'op' | 'user' | 'visitor';
            let quota: number | 'inf';
            if (quotaStr.toLowerCase() === 'inf') {
                quota = 'inf';
            } else {
                const parsedQuota = parseInt(quotaStr, 10);
                if (isNaN(parsedQuota) || parsedQuota < 1) {
                    return 'ERROR:额度必须是正整数或"inf"';
                }
                quota = parsedQuota;
            }
            const validPermissions = ['admin', 'op', 'user', 'visitor'];
            if (!validPermissions.includes(permissionStr)) {
                return `ERROR:无效的权限组，可选值: ${validPermissions.join(', ')}`;
            }
            const result = createKey(verifyResult.key.key, quota, permissionStr, id);
            if (result.success) {
                return `SUCCESS:KEY创建成功\nKEY: ${result.key}\n额度: ${quota}\n权限组: ${permissionStr}`;
            } else {
                return `ERROR:${result.error}`;
            }
        }

        case 'addblacklist': {
            if (args.length < 1) {
                return 'ERROR:用法: ^mulset addblacklist <QQ号> [原因]';
            }
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            const targetQq = args[0];
            const reason = args.slice(1).join(' ') || '无原因';
            const result = addToBlacklist(targetQq, id, reason);
            if (result.success) {
                return `SUCCESS:已将 ${targetQq} 加入黑名单`;
            } else {
                return `ERROR:${result.error}`;
            }
        }

        case 'view': {
            if (args[0] !== 'status') {
                return 'ERROR:用法: ^mulset view status';
            }
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            const status = getMainStatus();
            const statusJson = status ? JSON.stringify(status, null, 2) : 'ERROR:main_status为空';
            const maxLength = 600;
            const maxSegments = 10;
            const totalLength = statusJson.length;
            const segments = Math.ceil(totalLength / maxLength);
            const actualSegments = Math.min(segments, maxSegments);

            if (totalLength > maxLength * maxSegments) {
                const statusPath = path.join(__dirname, "../../../../core_datas/main_virtual/main_virtual.status");
                if (fs.existsSync(statusPath)) {
                    QQsendFile(id, statusPath).catch(console.error);
                    return `状态数据过长(${totalLength}字符)，已发送文件`;
                } else {
                    return `状态数据过长(${totalLength}字符)，且状态文件不存在`;
                }
            }

            for (let i = 0; i < actualSegments; i++) {
                const start = i * maxLength;
                const end = Math.min(start + maxLength, totalLength);
                const segment = statusJson.substring(start, end);
                const header = actualSegments > 1 ? `[${i + 1}/${actualSegments}] ` : '';
                QQsendMessage(id, header + segment).catch(console.error);
            }
            return `状态已发送，共${actualSegments}段`;
        }

        case 'reload': {
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            return reloadMainStatus();
        }

        case 'reset': {
            if (args[0] !== 'api_source') {
                return 'ERROR:用法: ^mulset reset api_source';
            }
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            getApiKeyManager().resetToFirstKey();
            return 'SUCCESS:已将 API 重置为第一个';
        }

        case 'bash': {
            if (args.length < 1) {
                return 'ERROR:用法: ^mulset bash <命令>';
            }
            const verifyResult = verifyQqKey(id);
            if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                return 'ERROR:权限不足，需要op或更高权限';
            }
            const bashCmd = args.join(' ');
            try {
                const { stdout, stderr } = await execAsync(bashCmd, { timeout: 30000 });
                let output = '';
                if (stdout) output += stdout;
                if (stderr) output += `\n[stderr]\n${stderr}`;
                if (output.length > 2000) {
                    output = output.substring(0, 2000) + '\n...(输出过长，已截断)';
                }
                return output || 'SUCCESS:命令执行成功，无输出';
            } catch (error: any) {
                return `ERROR:执行失败: ${error.message}`;
            }
        }

        case 'pipe': {
            if (args.length < 1) {
                return 'ERROR:用法: ^mulset pipe <check|reg_name|creat_pipe|list> [参数]';
            }
            const pipeSubCmd = args[0]?.toLowerCase();
            
            switch (pipeSubCmd) {
                case 'check': {
                    if (args.length < 2) {
                        return 'ERROR:用法: ^mulset pipe check <name|uid>';
                    }
                    const target = args[1];
                    const info = check_component(target);
                    
                    if (!info.found) {
                        return `ERROR:未找到组件: ${target}`;
                    }
                    
                    let result = `【组件信息】\n`;
                    result += `类型: ${info.type}\n`;
                    result += `UID: ${info.uid}\n`;
                    if (info.name) result += `名称: ${info.name}\n`;
                    
                    if (info.type === 'source') {
                        result += `接口类型: ${info.input_type}`;
                    } else if (info.type === 'converter') {
                        result += `Converter类型: ${info.converter_type}\n`;
                        result += `输入UID: ${format_uid_with_name(info.input_uid!)}\n`;
                        result += `输出UID: ${format_uid_with_name(info.output_uid!)}\n`;
                        result += `输入接口类型: ${info.input_type}\n`;
                        result += `输出接口类型: ${info.output_type}`;
                    } else if (info.type === 'final_output') {
                        result += `接口类型: ${info.input_type}\n`;
                        result += `Output类型: ${info.output_type_name}`;
                    } else if (info.type === 'pipe') {
                        result += `输入端: ${format_uid_with_name(info.input_uid!)}\n`;
                        result += `输出端: ${format_uid_with_name(info.output_uid!)}`;
                    }
                    
                    return result;
                }
                
                case 'reg_name': {
                    if (args.length < 3) {
                        return 'ERROR:用法: ^mulset pipe reg_name <name> <uid>';
                    }
                    const name = args[1];
                    const uid = args[2];
                    reg_name(name, uid);
                    return `SUCCESS:已注册别名 "${name}" -> ${uid}`;
                }
                
                case 'creat_pipe': {
                    if (args.length < 3) {
                        return 'ERROR:用法: ^mulset pipe creat_pipe <input_name|uid> <output_name|uid>';
                    }
                    const inputUid = args[1];
                    const outputUid = args[2];
                    const result = creat_pipe(inputUid, outputUid);
                    return result;
                }
                
                case 'list': {
                    const all = list_all_components();
                    let result = '';
                    
                    result += `【Pipe连接】共 ${all.pipes.length} 个\n`;
                    for (const p of all.pipes) {
                        result += `  ${p.formatted}\n`;
                        result += `    类型:${p.input_type} -> ${p.output_type}\n`;
                    }
                    
                    result += `\n【Source数据源】共 ${all.sources.length} 个\n`;
                    for (const s of all.sources) {
                        result += `  ${s.formatted} [接口类型:${s.type}]\n`;
                    }
                    
                    result += `\n【Converter转换器】共 ${all.converters.length} 个\n`;
                    for (const c of all.converters) {
                        result += `  ${c.formatted}\n`;
                        result += `    类型:${c.input_type} -> ${c.output_type}\n`;
                    }
                    
                    result += `\n【Final Output最终输出】共 ${all.final_outputs.length} 个\n`;
                    for (const f of all.final_outputs) {
                        result += `  ${f.formatted} [接口类型:${f.interface_type} output:${f.output_type}]\n`;
                    }
                    
                    if (result.length > 2000) {
                        result = result.substring(0, 2000) + '\n...(输出过长，已截断)';
                    }
                    
                    return result;
                }
                
                default:
                    return 'ERROR:未知的 pipe 子命令\n用法: ^mulset pipe <check|reg_name|creat_pipe|list> [参数]';
            }
        }

        case 'help': {
            return getMulsetHelpText();
        }

        default:
            return 'ERROR:未知的 mulset 指令\n' + getMulsetHelpText();
    }
}

async function processMessage(
    msg: multi_contact_multimedia_message,
    data: RuntimeData,
    output_uid: string,
    output_type: string
): Promise<multi_contact_multimedia_message | null> {
    const { id, name, parts } = msg;

    let messageText = '';
    const inlines: inlineData[] = [];

    for (const part of parts) {
        if (part.type === 'text') {
            messageText += part.content;
        } else if (part.type === 'image' && part.inline) {
            messageText += part.content;
            inlines.push(part.inline);
        }
    }

    const mulsetCmd = parseMulsetCommand(messageText);
    if (mulsetCmd) {
        const result = await handleMulsetCommand(mulsetCmd.command, mulsetCmd.args, id, data, output_uid, output_type);
        if (result) {
            await QQsendMessage(id, result);
        }
        return null;
    }

    if (messageText.startsWith("^command ")) {
        const commandResult = runCommand(messageText, id, inlines, name);

        if (commandResult.stop) {
            if (commandResult.datas) {
                await QQsendMessage(id, commandResult.datas);
            }
            return null;
        }

        const newParts: multimedia_message[] = [];

        if (commandResult.datas) {
            newParts.push({ type: 'text', content: commandResult.datas });
        }

        for (const inline of inlines) {
            newParts.push({ type: 'image', content: '[图片]', inline });
        }

        return {
            id,
            name,
            parts: newParts
        };
    }

    if (data.queueStaging) {
        data.messageBuffer.push(msg);
        update_converter_runtime(output_uid, data);
        await QQsendMessage(id, 'SUCCESS:消息已加入暂存区');
        return null;
    }

    return msg;
}

export async function output(
    input: multi_contact_multimedia_message_array,
    runtime_data: any,
    output_uid: string,
    output_type: string
): Promise<void> {
    let data: RuntimeData = runtime_data || initRuntimeData();
    if (!runtime_data) {
        update_converter_runtime(output_uid, data);
    }

    const results: multi_contact_multimedia_message[] = [];

    for (const msg of input.messages) {
        const result = await processMessage(msg, data, output_uid, output_type);
        if (result) {
            results.push(result);
        }
    }

    if (results.length > 0) {
        const outputData: multi_contact_multimedia_message_array = {
            messages: results
        };
        await input_for_uid(output_uid, outputData, output_type);
    }
}

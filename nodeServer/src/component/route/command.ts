/**
 * 命令处理模块
 * 处理以 ^command 开头的指令
 *
 * 支持的指令：
 * - ^command new: 结束当前事件
 * - ^command help: 显示所有命令的用法
 * - ^command creatkey <额度> <权限组>: 创建新KEY（需要op权限）
 * - ^command checkkey: 查询当前绑定KEY的信息
 * - ^command bindkey <KEY>: 绑定KEY到当前QQ号
 * - ^command unbindkey: 解除当前QQ号的KEY绑定
 * - ^command addblacklist <QQ号> [原因]: 加入黑名单（需要op权限）
 */

import { routeOutput, Message, inlineData } from "../../types/process/process.type";
import { finish_event, get_busy, addQueueMessage, sendAll, getMainStatus, reloadMainStatus } from "../process/main_virtual";
import { createKey, checkKey, bindKeyToQq, unbindKeyFromQq, getAdminKey, verifyQqKey, addToBlacklist, hasPermission } from "../../utility/key_system/key_manager";
import { QQsendMessage, QQsendImg, sendStagedMessages, StagedMessage, QQsendFile } from "../../utility/QQ/qq";
import { checkPyServer, checkNapcat } from "../../utility/connect/connect";
import { readIni } from "../../utility/file_operation/read_ini";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

interface QueuedMessage {
    text: string;
    inlines: inlineData[];
}

const queueStaging: Map<string, boolean> = new Map();
const messageBuffer: Map<string, QueuedMessage[]> = new Map();

function isStagingMode(qqNum: string): boolean {
    return queueStaging.get(qqNum) === true;
}

function addToBuffer(qqNum: string, text: string, inlines: inlineData[] = []): void {
    if (!messageBuffer.has(qqNum)) {
        messageBuffer.set(qqNum, []);
    }
    messageBuffer.get(qqNum)!.push({ text, inlines });
}

function getAndClearBuffer(qqNum: string): QueuedMessage[] {
    const buffer = messageBuffer.get(qqNum) || [];
    messageBuffer.delete(qqNum);
    return buffer;
}

export function isCommandMessage(messageText: string, qqNum?: string): boolean {
    // 暂存模式下，所有消息都当作命令处理（进入runCommand）
    if (qqNum && isStagingMode(qqNum)) {
        return true;
    }
    // 非暂存模式，只有^command开头的才是命令
    return messageText.trim().startsWith("^command ");
}

/**
 * 提取指令中的参数
 * 格式: "^command 指令名 参数1 参数2 ..."
 */
function parseCommand(commandStr: string): { name: string; args: string[] } {
    const parts = commandStr.trim().split(/\s+/);
    const name = parts[0] || '';
    const args = parts.slice(1);
    return { name, args };
}

/**
 * 创建KEY指令
 * 格式: ^command creatkey <额度> <权限组>
 * 示例: ^command creatkey 100 user
 */
function handleCreateKey(args: string[], qqNum: string): string {
    if (args.length < 2) {
        return 'ERROR:用法: ^command creatkey <额度> <权限组>\n额度: 正整数或"inf"\n权限组: admin, op, user, visitor';
    }

    const quotaStr = args[0];
    const permissionStr = args[1] as 'admin' | 'op' | 'user' | 'visitor';

    // 解析额度
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

    // 解析权限组
    const validPermissions = ['admin', 'op', 'user', 'visitor'];
    if (!validPermissions.includes(permissionStr)) {
        return `ERROR:无效的权限组，可选值: ${validPermissions.join(', ')}`;
    }

    // 检查用户权限
    const verifyResult = verifyQqKey(qqNum);
    if (!verifyResult.valid || !verifyResult.key) {
        return 'ERROR:权限不足，需要绑定op或admin权限的KEY';
    }

    // 检查是否有创建权限
    if (!hasPermission(verifyResult.key.key, 'op')) {
        return 'ERROR:权限不足，需要op或更高权限才能创建KEY';
    }

    // 使用当前用户的KEY创建新KEY
    const result = createKey(verifyResult.key.key, quota, permissionStr, qqNum);

    if (result.success) {
        return `SUCCESS:KEY创建成功\nKEY: ${result.key}\n额度: ${quota}\n权限组: ${permissionStr}\n\n使用方法: 发送 "^command bindkey ${result.key}" 绑定此KEY`;
    } else {
        return `ERROR:${result.error}`;
    }
}

/**
 * 查询KEY信息指令
 * 格式: ^command checkkey
 * 或: ^command checkkey <KEY>
 */
function handleCheckKey(args: string[], qqNum: string): string {
    let keyToCheck: string | null = null;

    // 如果提供了KEY参数，查询指定KEY
    if (args.length > 0) {
        keyToCheck = args[0];
    } else {
        // 否则查询当前QQ绑定的KEY
        const verifyResult = verifyQqKey(qqNum);
        if (!verifyResult.key) {
            return 'ERROR:你当前未绑定KEY';
        }
        keyToCheck = verifyResult.key.key;
    }

    const keyRecord = checkKey(keyToCheck);
    if (!keyRecord) {
        return `ERROR:KEY "${keyToCheck}" 不存在`;
    }

    // 格式化输出
    const quotaDisplay = keyRecord.quota === 'inf' ? '无限' : String(keyRecord.quota);
    const totalDisplay = keyRecord.total_quota === 'inf' ? '无限' : String(keyRecord.total_quota);
    const usedDisplay = keyRecord.total_quota === 'inf' ? '无限' :
        String((keyRecord.total_quota as number) - (keyRecord.quota as number));

    return `KEY信息:\nKEY: ${keyRecord.key}\n权限组: ${keyRecord.permission}\n剩余额度: ${quotaDisplay}\n已用额度: ${usedDisplay}\n总额度: ${totalDisplay}\n创建者: ${keyRecord.creator_qq}\n创建时间: ${keyRecord.created_at}`;
}

/**
 * 绑定KEY指令
 * 格式: ^command bindkey <KEY>
 */
function handleBindKey(args: string[], qqNum: string): string {
    if (args.length < 1) {
        return 'ERROR:用法: ^command bindkey <KEY>\n示例: ^command bindkey ABC12345';
    }

    const key = args[0];
    const result = bindKeyToQq(qqNum, key);

    if (result.success) {
        return `SUCCESS:KEY绑定成功\n你已绑定KEY: ${key}\n现在可以使用 cyanAI 服务了`;
    } else {
        return `ERROR:${result.error}`;
    }
}

/**
 * 解除KEY绑定指令
 * 格式: ^command unbindkey
 */
function handleUnbindKey(args: string[], qqNum: string): string {
    const result = unbindKeyFromQq(qqNum);

    if (result.success) {
        return 'SUCCESS:KEY已解除绑定\n如需继续使用，请绑定新的KEY';
    } else {
        return `ERROR:${result.error}`;
    }
}

/**
 * 帮助指令
 * 格式: ^command help
 */
function handleHelp(): string {
    return `cyanAI 命令帮助：

【基础命令】
^command new
  结束当前事件

^command help
  显示此帮助信息

【消息队列命令】
^command queuestart
  开启暂存模式，后续消息将被暂存不发送

^command queuesend
  关闭暂存模式，发送暂存的所有消息

【测试命令】
^command test connect pyServer
  测试 Python 服务器连接状态

^command test connect napcat
  测试 Napcat (QQ) 连接状态

^command test ping <url>
  Ping 指定 URL

【管理员命令】
^command view status
  查看 main_status 状态（需要op权限）

^command reload
  删除 main_status 文件并重置状态（需要op权限）

^command bash <命令>
  执行 bash 命令（需要op权限）

^command creatkey <额度> <权限组>
  创建新KEY（需要op权限）
  额度: 正整数或"inf"（无限）
  权限组: admin, op, user, visitor
  示例: ^command creatkey 100 user

^command checkkey [KEY]
  查询KEY信息
  不指定KEY则查询当前绑定的KEY
  示例: ^command checkkey
       ^command checkkey ABC123

^command bindkey <KEY>
  绑定KEY到当前QQ号
  示例: ^command bindkey ABC123

^command unbindkey
  解除当前QQ号的KEY绑定

^command addblacklist <QQ号> [原因]
  将QQ号加入黑名单（需要op权限）
  示例: ^command addblacklist 123456789 违规发言

【说明】
- 一个QQ号只能绑定一个KEY
- 一个KEY可以绑定多个QQ号（每个绑定扣除1点额度）
- 管理员QQ号无需绑定KEY即可使用所有功能`;
}

/**
 * 加入黑名单指令
 * 格式: ^command addblacklist <QQ号> [原因]
 * 示例: ^command addblacklist 123456789 违规发言
 */
function handleAddBlacklist(args: string[], qqNum: string): string {
    // 需要 op 或更高权限
    const adminKey = getAdminKey();

    // 先检查是否是管理员KEY
    if (!verifyQqKey(qqNum).valid) {
        return 'ERROR:你需要绑定KEY才能执行此操作';
    }

    const keyInfo = verifyQqKey(qqNum);
    if (!keyInfo.key) {
        return 'ERROR:无法获取你的KEY信息';
    }

    // 检查权限
    if (!hasPermission(keyInfo.key.key, 'op')) {
        return 'ERROR:权限不足，需要op或更高权限';
    }

    if (args.length < 1) {
        return 'ERROR:用法: ^command addblacklist <QQ号> [原因]\n示例: ^command addblacklist 123456789 违规发言';
    }

    const targetQq = args[0];
    const reason = args.slice(1).join(' ') || '未说明';

    const result = addToBlacklist(targetQq, reason, qqNum);

    if (result.success) {
        return `SUCCESS:已将 QQ ${targetQq} 加入黑名单\n原因: ${reason}`;
    } else {
        return `ERROR:${result.error}`;
    }
}

const execAsync = promisify(exec);

function handleTestConnectPyServer(qqNum: string): string {
    checkPyServer().then((result) => {
        if (result.success) {
            QQsendMessage(qqNum, `SUCCESS:${result.message}\n地址: ${result.details.url}\n响应: ${JSON.stringify(result.details.response)}`).catch(console.error);
        } else {
            QQsendMessage(qqNum, `ERROR:${result.message}`).catch(console.error);
        }
    });
    return `正在测试pyServer连接...`;
}

function handleTestConnectNapcat(): string {
    const result = checkNapcat();
    return `Napcat连接状态:\nAPI WebSocket: ${result.details.api}\nEvent WebSocket: ${result.details.event}\n总体状态: ${result.message}`;
}

function handleTestPingUrl(url: string, qqNum: string): string {
    if (!url) {
        return 'ERROR:用法: ^command test ping <url>';
    }
    const urlToTest = url.startsWith('http') ? url : `http://${url}`;
    const startTime = Date.now();
    fetch(urlToTest, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
    })
        .then((response) => {
            const elapsed = Date.now() - startTime;
            QQsendMessage(qqNum, `SUCCESS:Ping成功\nURL: ${urlToTest}\n状态码: ${response.status}\n耗时: ${elapsed}ms`).catch(console.error);
        })
        .catch((error) => {
            QQsendMessage(qqNum, `ERROR:Ping失败\nURL: ${url}\n错误: ${error.message}`).catch(console.error);
        });
    return `正在Ping: ${urlToTest}`;
}

function handleTestCommand(args: string[], qqNum?: string): routeOutput {
    if (args.length < 1) {
        return {
            stop: true,
            datas: 'ERROR:用法: ^command test <connect|ping> [参数]'
        };
    }

    if (!qqNum) {
        return {
            stop: true,
            datas: 'ERROR:无法获取QQ号'
        };
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
        case 'connect':
            if (args.length < 2) {
                return {
                    stop: true,
                    datas: 'ERROR:用法: ^command test connect <pyServer|napcat>'
                };
            }
            const target = args[1].toLowerCase();
            if (target === 'pyserver') {
                return {
                    stop: true,
                    datas: handleTestConnectPyServer(qqNum)
                };
            } else if (target === 'napcat') {
                return {
                    stop: true,
                    datas: handleTestConnectNapcat()
                };
            } else {
                return {
                    stop: true,
                    datas: 'ERROR:用法: ^command test connect <pyServer|napcat>'
                };
            }

        case 'ping':
            if (args.length < 2) {
                return {
                    stop: true,
                    datas: 'ERROR:用法: ^command test ping <url>'
                };
            }
            return {
                stop: true,
                datas: handleTestPingUrl(args[1], qqNum)
            };

        default:
            return {
                stop: true,
                datas: 'ERROR:用法: ^command test <connect|ping> [参数]'
            };
    }
}

function handleBashCommand(args: string[], qqNum?: string): routeOutput {
    if (!qqNum) {
        return {
            stop: true,
            datas: 'ERROR:无法获取QQ号'
        };
    }
    const verifyResult = verifyQqKey(qqNum);
    if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
        return {
            stop: true,
            datas: 'ERROR:权限不足，需要op或更高权限'
        };
    }

    if (args.length < 1) {
        return {
            stop: true,
            datas: 'ERROR:用法: ^command bash <命令>'
        };
    }

    const bashCommand = args.join(' ');
    execAsync(bashCommand, { timeout: 30000 })
        .then(({ stdout, stderr }) => {
            const result = stdout || stderr || '命令执行完成，无输出';
            QQsendMessage(qqNum, `命令执行结果:\n${result.substring(0, 2000)}`).catch(console.error);
        })
        .catch((error) => {
            QQsendMessage(qqNum, `命令执行失败: ${error.message}`).catch(console.error);
        });

    return {
        stop: true,
        datas: `SUCCESS:命令已提交执行: ${bashCommand}`
    };
}

/**
 * 主命令处理函数
 * @param input - 用户输入的原始文本
 * @param qqNum - 当前用户的QQ号（用于需要QQ号的操作）
 * @param inlines - 内联数据（图片等）
 * @param qqName - QQ昵称（用于发送暂存消息）
 * @returns routeOutput - 包含是否停止处理和数据
 */
export function runCommand(input: string, qqNum?: string, inlines: inlineData[] = [], qqName?: string): routeOutput {
    if (!input.startsWith("^command ")) {
        if (qqNum && isStagingMode(qqNum)) {
            addToBuffer(qqNum, input, inlines);
            return {
                stop: true,
                datas: 'SUCCESS:消息已加入暂存区'
            };
        }
        return {
            stop: false,
            datas: input
        };
    }

    const command = input.slice(9).trim();
    const { name, args } = parseCommand(command);

    // 处理各个指令
    switch (name.toLowerCase()) {
        case 'new':
            // 结束当前事件
            if (!get_busy()) {
                console.log("正在准备结束事件");
                finish_event();
                return {
                    stop: true,
                    datas: '事件已结束'
                };
            } else {
                return {
                    stop: true,
                    datas: '繁忙中，请重试'
                };
            }

        case 'help':
            // 显示帮助信息
            return {
                stop: true,
                datas: handleHelp()
            };

        case 'creatkey':
            // 创建新KEY
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const createResult = handleCreateKey(args, qqNum);
            return {
                stop: true,
                datas: createResult
            };

        case 'checkkey':
            // 查询KEY信息
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const checkResult = handleCheckKey(args, qqNum);
            return {
                stop: true,
                datas: checkResult
            };

        case 'bindkey':
            // 绑定KEY
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const bindResult = handleBindKey(args, qqNum);
            return {
                stop: true,
                datas: bindResult
            };

        case 'unbindkey':
            // 解除KEY绑定
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const unbindResult = handleUnbindKey(args, qqNum);
            return {
                stop: true,
                datas: unbindResult
            };

        case 'addblacklist':
            // 加入黑名单
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const blacklistResult = handleAddBlacklist(args, qqNum);
            return {
                stop: true,
                datas: blacklistResult
            };

        case 'queuestart':
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            queueStaging.set(qqNum, true);
            return {
                stop: true,
                datas: 'SUCCESS:暂存模式已开启，发送的消息将被暂存，使用 ^command queueSend 发送'
            };

        case 'queuesend':
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            queueStaging.set(qqNum, false);
            const buffer = getAndClearBuffer(qqNum);
            if (buffer.length === 0) {
                return {
                    stop: true,
                    datas: 'SUCCESS:暂存区为空，无消息发送'
                };
            }
            const stagedMessages: StagedMessage[] = buffer.map(msg => ({
                text: msg.text,
                inlines: msg.inlines
            }));
            sendStagedMessages(qqNum, qqName || '未知用户', stagedMessages).catch((error: any) => {
                console.error('queueSend发送消息失败:', error);
            });
            return {
                stop: true,
                datas: `SUCCESS:暂存模式已关闭，正在发送 ${buffer.length} 条消息`
            };

        case 'view':
            if (args[0] === 'status') {
                if (!qqNum) {
                    return {
                        stop: true,
                        datas: 'ERROR:无法获取QQ号'
                    };
                }
                const verifyResult = verifyQqKey(qqNum);
                if (!verifyResult.valid || !verifyResult.key || !hasPermission(verifyResult.key.key, 'op')) {
                    return {
                        stop: true,
                        datas: 'ERROR:权限不足，需要op或更高权限'
                    };
                }
                const status = getMainStatus();
                const statusJson = status ? JSON.stringify(status, null, 2) : 'ERROR:main_status为空';
                const maxLength = 600;
                const maxSegments = 10;
                const totalLength = statusJson.length;
                const segments = Math.ceil(totalLength / maxLength);
                const actualSegments = Math.min(segments, maxSegments);

                if (totalLength > maxLength * maxSegments) {
                    const statusPath = path.join(__dirname, "../../../core_datas/main_virtual/main_virtual.status");
                    if (fs.existsSync(statusPath)) {
                        QQsendFile(qqNum!, statusPath).catch(console.error);
                        return {
                            stop: true,
                            datas: `状态数据过长(${totalLength}字符)，已发送文件`
                        };
                    } else {
                        return {
                            stop: true,
                            datas: `状态数据过长(${totalLength}字符)，且状态文件不存在`
                        };
                    }
                }

                for (let i = 0; i < actualSegments; i++) {
                    const start = i * maxLength;
                    const end = Math.min(start + maxLength, totalLength);
                    const segment = statusJson.substring(start, end);
                    const header = actualSegments > 1 ? `[${i + 1}/${actualSegments}] ` : '';
                    QQsendMessage(qqNum!, header + segment).catch(console.error);
                }
                return {
                    stop: true,
                    datas: `状态已发送，共${actualSegments}段`
                };
            }
            return {
                stop: true,
                datas: 'ERROR:用法: ^command view status'
            };

        case 'reload':
            if (!qqNum) {
                return {
                    stop: true,
                    datas: 'ERROR:无法获取QQ号'
                };
            }
            const reloadVerifyResult = verifyQqKey(qqNum);
            if (!reloadVerifyResult.valid || !reloadVerifyResult.key || !hasPermission(reloadVerifyResult.key.key, 'op')) {
                return {
                    stop: true,
                    datas: 'ERROR:权限不足，需要op或更高权限'
                };
            }
            const reloadResult = reloadMainStatus();
            return {
                stop: true,
                datas: reloadResult
            };

        case 'test':
            return handleTestCommand(args, qqNum);

        case 'bash':
            return handleBashCommand(args, qqNum);

        default:
            return {
                stop: true,
                datas: `ERROR:未知命令 "${name}"\n发送 "^command help" 查看所有可用命令`
            };
    }
}
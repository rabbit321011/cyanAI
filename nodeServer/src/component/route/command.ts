import { routeOutput, inlineData } from "../../types/process/process.type";
import { finish_event, get_busy } from "../process/main_virtual";
import { QQsendMessage } from "../../utility/QQ/qq";
import { checkPyServer, checkNapcat } from "../../utility/connect/connect";

export function isCommandMessage(messageText: string): boolean {
    return messageText.trim().startsWith("^command ");
}

function parseCommand(commandStr: string): { name: string; args: string[] } {
    const parts = commandStr.trim().split(/\s+/);
    const name = parts[0] || '';
    const args = parts.slice(1);
    return { name, args };
}

function handleHelp(): string {
    return `cyanAI 命令帮助：

【基础命令】
^command new
  结束当前事件

^command help
  显示此帮助信息

【测试命令】
^command test connect pyServer
  测试 Python 服务器连接状态

^command test connect napcat
  测试 Napcat (QQ) 连接状态

^command test ping <url>
  Ping 指定 URL

【mulset 命令】
发送 ^mulset help 查看更多命令`;
}

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

export function runCommand(input: string, qqNum?: string, inlines: inlineData[] = [], qqName?: string): routeOutput {
    if (!input.startsWith("^command ")) {
        return {
            stop: false,
            datas: input
        };
    }

    const command = input.slice(9).trim();
    const { name, args } = parseCommand(command);

    switch (name.toLowerCase()) {
        case 'new':
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
            return {
                stop: true,
                datas: handleHelp()
            };

        case 'test':
            return handleTestCommand(args, qqNum);

        default:
            return {
                stop: true,
                datas: `ERROR:未知命令: ${name}\n发送 ^command help 查看帮助`
            };
    }
}

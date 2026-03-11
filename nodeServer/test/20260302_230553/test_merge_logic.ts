// 测试 sendAll 中的 Message 合并逻辑
// 这个测试会模拟 sendAll 中的转换逻辑，验证相同 role_type 的消息是否被正确合并

import { Message, inlineData } from '../../src/types/process/process.type';

// 模拟 content_unit 接口
interface content_unit {
    role: string;
    parts: any[];
}

// 模拟转换逻辑（从 sendAll 中提取）
function convertMessagesToContent(messages: Message[]): content_unit[] {
    let content_temp: content_unit[] = [];
    let last_unit: content_unit | null = null;

    messages.map((curr) => {
        // 检查是否可以和上一条合并（相同role_type）
        if (last_unit && last_unit.role === curr.role_type) {
            // 合并到同一个content_unit的parts中
            if (curr.current !== "") {
                let temp_text = "";
                temp_text += '^' + curr.role + ':' + curr.time + ':' + curr.current;
                last_unit.parts.push({ text: temp_text });
            }
            if (curr.inline.length !== 0)
                curr.inline.map((inlineUnit) => {
                    last_unit!.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                });
            // 处理工具调用
            if (curr.toolsCalls && curr.toolsCalls.length > 0) {
                curr.toolsCalls.map((toolCall) => {
                    const part: any = {
                        functionCall: {
                            name: `default_api:${toolCall.name}`,
                            args: toolCall.args
                        }
                    };
                    if (toolCall.thoughtSignature) {
                        part.thoughtSignature = toolCall.thoughtSignature;
                    }
                    last_unit!.parts.push(part);
                });
            }
            // 处理工具响应
            if (curr.toolsResponse && curr.toolsResponse.length > 0) {
                curr.toolsResponse.map((toolResponse) => {
                    last_unit!.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                });
            }
        } else {
            // 创建新的content_unit
            let temp_content_unit: content_unit = {
                role: curr.role_type,
                parts: []
            };

            if (curr.current !== "") {
                let temp_text = "";
                temp_text += '^' + curr.role + ':' + curr.time + ':' + curr.current;
                temp_content_unit.parts.push({ text: temp_text });
            }
            if (curr.inline.length !== 0)
                curr.inline.map((inlineUnit) => {
                    temp_content_unit.parts.push({ inlineData: { mimeType: inlineUnit.mimeType, data: inlineUnit.data } });
                });
            // 处理工具调用
            if (curr.toolsCalls && curr.toolsCalls.length > 0) {
                curr.toolsCalls.map((toolCall) => {
                    const part: any = {
                        functionCall: {
                            name: `default_api:${toolCall.name}`,
                            args: toolCall.args
                        }
                    };
                    if (toolCall.thoughtSignature) {
                        part.thoughtSignature = toolCall.thoughtSignature;
                    }
                    temp_content_unit.parts.push(part);
                });
            }
            // 处理工具响应
            if (curr.toolsResponse && curr.toolsResponse.length > 0) {
                curr.toolsResponse.map((toolResponse) => {
                    temp_content_unit.parts.push({ functionResponse: { name: toolResponse.name, response: toolResponse.response } });
                });
            }

            content_temp.push(temp_content_unit);
            last_unit = temp_content_unit;
        }
    });

    return content_temp;
}

// 创建测试数据
function createTestMessages(): Message[] {
    const baseMsg: Partial<Message> = {
        role_type: "user",
        role: "测试用户",
        file: [],
        toolsCalls: [],
        toolsResponse: []
    };

    return [
        {
            ...baseMsg,
            current: "第一条消息",
            time: "20260302_230812",
            inline: []
        } as Message,
        {
            ...baseMsg,
            current: "第二条消息（带图片）",
            time: "20260302_230813",
            inline: [{ mimeType: "image/jpeg", data: "base64img1" }]
        } as Message,
        {
            ...baseMsg,
            current: "第三条消息",
            time: "20260302_230814",
            inline: []
        } as Message,
        {
            ...baseMsg,
            role_type: "model",
            role: "AI助手",
            current: "AI回复",
            time: "20260302_230815",
            inline: []
        } as Message,
        {
            ...baseMsg,
            current: "用户继续",
            time: "20260302_230816",
            inline: [{ mimeType: "image/png", data: "base64img2" }]
        } as Message
    ];
}

// 运行测试
function testMergeLogic() {
    console.log("=== 测试 Message 合并逻辑 ===\n");

    const messages = createTestMessages();
    console.log("原始消息数量:", messages.length);
    console.log("原始消息结构:");
    messages.forEach((msg, i) => {
        console.log(`  [${i}] ${msg.role_type} (${msg.role}): ${msg.current.substring(0, 20)}... inline:${msg.inline.length}`);
    });

    console.log("\n--- 转换后 ---\n");

    const content = convertMessagesToContent(messages);
    console.log("转换后的 content_unit 数量:", content.length);
    console.log("\n转换后的结构:");
    content.forEach((unit, i) => {
        console.log(`\n[${i}] role: ${unit.role}, parts数量: ${unit.parts.length}`);
        unit.parts.forEach((part, j) => {
            if (part.text) {
                console.log(`  part[${j}]: text = "${part.text.substring(0, 40)}..."`);
            } else if (part.inlineData) {
                console.log(`  part[${j}]: inlineData (${part.inlineData.mimeType})`);
            } else if (part.functionCall) {
                console.log(`  part[${j}]: functionCall (${part.functionCall.name})`);
            } else if (part.functionResponse) {
                console.log(`  part[${j}]: functionResponse (${part.functionResponse.name})`);
            }
        });
    });

    // 验证结果
    console.log("\n=== 验证结果 ===");
    let passed = true;

    // 检查1: 相同 role_type 的消息应该合并
    if (content.length !== 3) {
        console.log("❌ 失败: 应该有3个 content_unit (user+user+user合并, model, user), 实际有", content.length);
        passed = false;
    } else {
        console.log("✓ 通过: content_unit 数量正确 (3个)");
    }

    // 检查2: 第一个 content_unit 应该有4个 parts (3条消息: 3个text + 1个inlineData)
    if (content[0].parts.length !== 4) {
        console.log("❌ 失败: 第一个 content_unit 应该有4个 parts (3个text + 1个inlineData), 实际有", content[0].parts.length);
        passed = false;
    } else {
        console.log("✓ 通过: 第一个 content_unit 有4个 parts (3条user消息合并: 3个text + 1个inlineData)");
    }

    // 检查3: 第二个 content_unit 应该是 model
    if (content[1].role !== "model") {
        console.log("❌ 失败: 第二个 content_unit 应该是 model, 实际是", content[1].role);
        passed = false;
    } else {
        console.log("✓ 通过: 第二个 content_unit 是 model");
    }

    // 检查4: 第三个 content_unit 应该有2个 parts (文字+图片)
    if (content[2].parts.length !== 2) {
        console.log("❌ 失败: 第三个 content_unit 应该有2个 parts (文字+图片), 实际有", content[2].parts.length);
        passed = false;
    } else {
        console.log("✓ 通过: 第三个 content_unit 有2个 parts (文字+图片)");
    }

    console.log("\n=== 测试", passed ? "全部通过 ✓" : "有失败 ❌", "===");
    return passed;
}

// 运行测试
testMergeLogic();

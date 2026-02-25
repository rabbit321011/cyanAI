import { saveEvent } from "../src/component/events/event_saver";
import { Message } from "../src/types/process/process.type";
import { now } from "../src/utility/time/cyan_time";

console.log("=== saveEvent 调试测试 ===\n");

const testMessages: Message[] = [
    {
        current: "调试测试消息1",
        role_type: "user",
        role: "调试用户",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    },
    {
        current: "调试测试回复1",
        role_type: "model",
        role: "cyanAI",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    }
];

console.log("当前时间戳:", now());
console.log("准备调用 saveEvent...\n");

const result = saveEvent(testMessages, "这是一个调试测试事件", 8);
console.log("\nsaveEvent 返回结果:", result);

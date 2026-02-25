import { saveEvent } from "../src/component/events/event_saver";
import { Message } from "../src/types/process/process.type";
import { now } from "../src/utility/time/cyan_time";

console.log("简单测试 saveEvent 函数...\n");

const testMessages: Message[] = [
    {
        current: "测试消息1",
        role_type: "user",
        role: "测试用户",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    },
    {
        current: "测试回复1",
        role_type: "model",
        role: "cyanAI",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    }
];

const result = saveEvent(testMessages, "这是一个简单测试事件", 5);
console.log("saveEvent 返回结果:", result);

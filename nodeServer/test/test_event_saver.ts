import { saveEvent } from "../src/component/events/event_saver";
import { Message } from "../src/types/process/process.type";
import { now } from "../src/utility/time/cyan_time";

console.log("开始测试 saveEvent 函数...");

const testMessages: Message[] = [
    {
        current: "你好，我想测试一下事件保存功能",
        role_type: "user",
        role: "测试用户",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    },
    {
        current: "好的，我来帮你测试！",
        role_type: "model",
        role: "cyanAI",
        time: now(),
        file: [],
        inline: [],
        toolsCalls: [],
        toolsResponse: []
    }
];

const result = saveEvent(testMessages, "这是一个测试事件", 8);
console.log("saveEvent 返回结果:", result);

if (result.startsWith("SUCCESS")) {
    console.log("✅ 测试成功！");
} else {
    console.log("❌ 测试失败！");
}

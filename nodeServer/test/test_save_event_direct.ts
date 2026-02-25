import { getCoreStateForFile, main_status } from "../src/component/process/main_virtual";
import { saveEvent } from "../src/component/events/event_saver";

console.log("直接测试 saveEvent 函数...\n");

console.log("1. 加载核心状态...");
const loadResult = getCoreStateForFile();
console.log("加载结果:", loadResult);

if (loadResult.startsWith("ERROR") || !main_status) {
    console.error("❌ 加载状态失败！");
    process.exit(1);
}

console.log(`\n2. Context 有 ${main_status.context.length} 条消息`);
console.log("准备保存前 16 条消息 (slice(0,-2))...");

const testSummary = "测试直接保存事件";
const testIm = 7;

const result = saveEvent(main_status.context.slice(0, -2), testSummary, testIm);
console.log("\nsaveEvent 返回结果:", result);

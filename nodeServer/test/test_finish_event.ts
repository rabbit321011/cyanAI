import { finish_event, getCoreStateForFile } from "../src/component/process/main_virtual";

console.log("开始测试 finish_event 函数...\n");

console.log("1. 先加载核心状态...");
const loadResult = getCoreStateForFile();
console.log("加载结果:", loadResult);

if (loadResult.startsWith("ERROR")) {
    console.error("❌ 加载状态失败，无法继续测试！");
    process.exit(1);
}

console.log("\n2. 调用 finish_event()...");
finish_event().then(result => {
    console.log("finish_event 返回结果:", result);
    
    if (result.startsWith("SUCCESS")) {
        console.log("\n✅ 测试成功！");
    } else {
        console.log("\n❌ 测试失败！");
    }
}).catch(error => {
    console.error("❌ 发生异常:", error);
});

import { loadInitialEvents } from "../src/component/events/event_loader";

console.log("开始测试 event_loader 读取刚创建的事件...");

try {
    const events = loadInitialEvents();
    console.log(`✅ 成功加载 ${events.length} 个事件！`);
    
    console.log("\n=== 事件列表 ===");
    events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.current}`);
        console.log(`   来源: ${event.source.path}`);
        console.log(`   条目数: ${event.source.reference[0].end}`);
        console.log();
    });
    
} catch (error) {
    console.error("❌ 加载事件失败:", error);
}

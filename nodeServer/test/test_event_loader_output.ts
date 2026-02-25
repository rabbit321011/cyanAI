import { loadInitialEvents } from '../src/component/events/event_loader';

console.log('=== 测试 event_loader 加载结果 ===\n');

try {
    const events = loadInitialEvents();
    console.log(`✅ 加载成功！共 ${events.length} 个事件\n`);
    console.log('返回结果：');
    console.log(JSON.stringify(events, null, 2));
} catch (error) {
    console.error('❌ 加载失败：', error);
}

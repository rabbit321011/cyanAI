// 检查图片消息是否被总结
import fs from 'fs';
import path from 'path';

const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
const status = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));

console.log("=== 检查所有消息 ===\n");
status.context.forEach((msg: any, idx: number) => {
    console.log(`消息 ${idx + 1}:`);
    console.log(`  - role_type: ${msg.role_type}`);
    console.log(`  - role: ${msg.role}`);
    console.log(`  - current: ${msg.current.substring(0, 100)}${msg.current.length > 100 ? '...' : ''}`);
    console.log(`  - inline 数量: ${msg.inline?.length || 0}`);
    console.log(`  - time: ${msg.time}`);
    console.log();
});

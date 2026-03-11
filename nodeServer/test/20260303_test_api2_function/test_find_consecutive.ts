import fs from 'fs';
import path from 'path';

// 读取 main_virtual.status
const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));

console.log('=== 查找连续的 model 消息 ===\n');

const context = statusData.context;

// 查找所有连续的 model
let lastType = context[0].role_type;
for (let i = 1; i < context.length; i++) {
    const currentType = context[i].role_type;
    if (lastType === 'model' && currentType === 'model') {
        console.log(`❌ 发现连续的 model 在索引 ${i-1} 和 ${i}`);
        console.log('\n  索引', i-1, '的消息:');
        console.log('    role_type:', context[i-1].role_type);
        console.log('    time:', context[i-1].time);
        console.log('    current:', context[i-1].current?.substring(0, 100) || '(空)');
        console.log('    toolsCalls:', context[i-1].toolsCalls?.length || 0);
        
        console.log('\n  索引', i, '的消息:');
        console.log('    role_type:', context[i].role_type);
        console.log('    time:', context[i].time);
        console.log('    current:', context[i].current?.substring(0, 100) || '(空)');
        console.log('    toolsCalls:', context[i].toolsCalls?.length || 0);
        console.log('\n---\n');
    }
    lastType = currentType;
}

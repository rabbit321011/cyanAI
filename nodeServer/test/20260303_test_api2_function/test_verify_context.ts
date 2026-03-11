import fs from 'fs';
import path from 'path';

// 读取 main_virtual.status
const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');
const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));

console.log('=== 验证 main_virtual.status 的上下文 ===\n');

const context = statusData.context;
console.log('总消息数:', context.length);

// 检查第一条消息
console.log('\n1. 检查第一条消息:');
console.log('   第一条 role_type:', context[0].role_type);
console.log('   第一条是否正确:', context[0].role_type === 'user' ? '✅' : '❌');

// 检查最后一条消息
console.log('\n2. 检查最后一条消息:');
const lastMsg = context[context.length - 1];
console.log('   最后一条 role_type:', lastMsg.role_type);
console.log('   最后一条是否正确:', lastMsg.role_type === 'user' ? '✅' : '❌');

// 检查是否有连续的 model
console.log('\n3. 检查是否有连续的 model:');
let hasConsecutiveModel = false;
let lastType = context[0].role_type;
for (let i = 1; i < context.length; i++) {
    const currentType = context[i].role_type;
    if (lastType === 'model' && currentType === 'model') {
        console.log(`   ❌ 发现连续的 model 在索引 ${i-1} 和 ${i}`);
        hasConsecutiveModel = true;
        break;
    }
    lastType = currentType;
}
if (!hasConsecutiveModel) {
    console.log('   ✅ 没有连续的 model');
}

// 检查所有消息的 toolsCalls 格式
console.log('\n4. 检查 toolsCalls 格式:');
let hasInvalidToolsCalls = false;
for (let i = 0; i < context.length; i++) {
    const msg = context[i];
    if (msg.toolsCalls && msg.toolsCalls.length > 0) {
        for (let j = 0; j < msg.toolsCalls.length; j++) {
            const tc = msg.toolsCalls[j];
            // 检查 thoughtSignature 是否存在且是字符串
            if (tc.thoughtSignature !== undefined) {
                if (typeof tc.thoughtSignature !== 'string') {
                    console.log(`   ❌ 消息 ${i}, toolsCall ${j}: thoughtSignature 类型错误: ${typeof tc.thoughtSignature}`);
                    hasInvalidToolsCalls = true;
                } else if (!/^[A-Za-z0-9+/=]+$/.test(tc.thoughtSignature)) {
                    console.log(`   ❌ 消息 ${i}, toolsCall ${j}: thoughtSignature 不是有效的 Base64: ${tc.thoughtSignature.substring(0, 50)}...`);
                    hasInvalidToolsCalls = true;
                }
            }
        }
    }
}
if (!hasInvalidToolsCalls) {
    console.log('   ✅ 所有 toolsCalls 格式正确');
}

// 总结
console.log('\n=== 验证结果 ===');
const firstIsUser = context[0].role_type === 'user';
const lastIsUser = lastMsg.role_type === 'user';
const noConsecutiveModel = !hasConsecutiveModel;
const validToolsCalls = !hasInvalidToolsCalls;

if (firstIsUser && lastIsUser && noConsecutiveModel && validToolsCalls) {
    console.log('✅ 所有检查通过，上下文格式正确');
} else {
    console.log('❌ 发现以下问题:');
    if (!firstIsUser) console.log('   - 第一条消息不是 user');
    if (!lastIsUser) console.log('   - 最后一条消息不是 user');
    if (!noConsecutiveModel) console.log('   - 存在连续的 model');
    if (!validToolsCalls) console.log('   - toolsCalls 格式有问题');
}

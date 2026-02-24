console.log('========================================');
console.log('💰 API 成本计算');
console.log('========================================');
console.log('');

// 已知数据
const TOTAL_USD = 600;           // 总共 600 美元
const TOTAL_RMB = 80;             // 花了 80 人民币
const TOTAL_TOKENS = 300000000;  // 总授予 300,000,000 tokens
const USED_TOKENS = 616710;      // 已使用 616,710 tokens
const CONVERSATIONS = 3;          // 对话了 3 条

console.log('📊 基础数据:');
console.log(`  总额度: $${TOTAL_USD} = ¥${TOTAL_RMB}`);
console.log(`  总 Tokens: ${TOTAL_TOKENS.toLocaleString()}`);
console.log(`  已使用 Tokens: ${USED_TOKENS.toLocaleString()}`);
console.log(`  对话条数: ${CONVERSATIONS} 条`);
console.log('');

// 计算 1
const USD_PER_TOKEN = TOTAL_USD / TOTAL_TOKENS;
const RMB_PER_TOKEN = TOTAL_RMB / TOTAL_TOKENS;
console.log('💰 单位 Token 成本:');
console.log(`  1 Token = $${USD_PER_TOKEN.toFixed(10)}`);
console.log(`  1 Token = ¥${RMB_PER_TOKEN.toFixed(10)}`);
console.log('');

// 计算 2（假设这 3 条用了所有已使用的 tokens）
const TOKENS_PER_CONVERSATION = USED_TOKENS / CONVERSATIONS;
const USD_PER_CONVERSATION = TOKENS_PER_CONVERSATION * USD_PER_TOKEN;
const RMB_PER_CONVERSATION = TOKENS_PER_CONVERSATION * RMB_PER_TOKEN;
console.log('💬 每条对话成本（假设这 3 条用了所有已使用的 tokens）:');
console.log(`  每条平均 Tokens: ${TOKENS_PER_CONVERSATION.toLocaleString()}`);
console.log(`  每条成本: $${USD_PER_CONVERSATION.toFixed(6)}`);
console.log(`  每条成本: ¥${RMB_PER_CONVERSATION.toFixed(6)}`);
console.log('');

// 计算 3
const CONVERSATIONS_PER_RMB = 1 / RMB_PER_CONVERSATION;
const CONVERSATIONS_PER_USD = 1 / USD_PER_CONVERSATION;
console.log('🎯 1 元能对话多少条:');
console.log(`  ¥1 能对话: ${CONVERSATIONS_PER_RMB.toFixed(1)} 条`);
console.log(`  $1 能对话: ${CONVERSATIONS_PER_USD.toFixed(1)} 条`);
console.log('');

// 计算 4（总对话数）
const TOTAL_CONVERSATIONS = TOTAL_TOKENS / TOKENS_PER_CONVERSATION;
console.log('📈 总共能对话:');
console.log(`  总共能对话: ${TOTAL_CONVERSATIONS.toLocaleString()} 条`);
console.log('');

console.log('========================================');

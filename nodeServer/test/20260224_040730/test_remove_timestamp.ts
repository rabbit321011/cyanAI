import { remove_timestamp } from '../../src/component/escaper/remove_timestamp';

console.log('========================================');
console.log('🧪 测试 remove_timestamp 函数');
console.log('========================================');
console.log('');

// 测试用例 1
const test1 = '^cyanAI:20260224_163737:^cyanAI:20260224_163748:^cyanAI:20260224_163750:^cyanAI:20260224_163755:^cyanAI:20260224_163800:^cyanAI:20260224_163805:然后这里才是真的字符串';
console.log('📝 测试 1:');
console.log('  输入:', test1);
console.log('  输出:', remove_timestamp(test1));
console.log('  ✅ 正确吗?', remove_timestamp(test1) === '然后这里才是真的字符串');
console.log('');

// 测试用例 2（不同的名字）
const test2 = '^user:20260101_120000:^model:20260101_120001:你好世界！';
console.log('📝 测试 2（不同的名字）:');
console.log('  输入:', test2);
console.log('  输出:', remove_timestamp(test2));
console.log('  ✅ 正确吗?', remove_timestamp(test2) === '你好世界！');
console.log('');

// 测试用例 3（没有前缀）
const test3 = '这是一个没有前缀的字符串';
console.log('📝 测试 3（没有前缀）:');
console.log('  输入:', test3);
console.log('  输出:', remove_timestamp(test3));
console.log('  ✅ 正确吗?', remove_timestamp(test3) === '这是一个没有前缀的字符串');
console.log('');

// 测试用例 4（空字符串）
const test4 = '';
console.log('📝 测试 4（空字符串）:');
console.log('  输入:', test4);
console.log('  输出:', remove_timestamp(test4));
console.log('  ✅ 正确吗?', remove_timestamp(test4) === '');
console.log('');

console.log('========================================');
console.log('✅ 测试完成！');
console.log('========================================');

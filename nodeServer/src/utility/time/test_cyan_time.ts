import * as CyanTime from './cyan_time';

console.log('🚀 开始全面测试 CyanTime...\n');

console.log('📋 convert 函数');
console.log('10s -> ms:', CyanTime.convert('10s', 'ms'));
console.log('5min -> s:', CyanTime.convert('5min', 's'));
console.log('2h -> min:', CyanTime.convert('2h', 'min'));
console.log('1day -> h:', CyanTime.convert('1day', 'h'));
console.log('1.5h -> min:', CyanTime.convert('1.5h', 'min'));
console.log('-10s -> ms:', CyanTime.convert('-10s', 'ms'));
console.log('0s -> timestamp:', CyanTime.convert('0s', 'timestamp'));

console.log('\n📋 add 函数');
console.log('10s + 5s:', CyanTime.add('10s', '5s'));
console.log('1min + 30s:', CyanTime.add('1min', '30s'));
console.log('2h + 30min:', CyanTime.add('2h', '30min'));
console.log('3day + 4day:', CyanTime.add('3day', '4day'));
console.log('1.5h + 0.5h:', CyanTime.add('1.5h', '0.5h'));
console.log('10s + -5s:', CyanTime.add('10s', '-5s'));

console.log('\n📋 sub 函数');
console.log('10s - 5s:', CyanTime.sub('10s', '5s'));
console.log('2min - 30s:', CyanTime.sub('2min', '30s'));
console.log('3h - 30min:', CyanTime.sub('3h', '30min'));
console.log('2.5h - 0.5h:', CyanTime.sub('2.5h', '0.5h'));
console.log('5s - 10s:', CyanTime.sub('5s', '10s'));

console.log('\n📋 mul 函数');
console.log('10s * 5:', CyanTime.mul('10s', 5));
console.log('10min * 1.5:', CyanTime.mul('10min', 1.5));
console.log('2h * 2:', CyanTime.mul('2h', 2));
console.log('10s * -1:', CyanTime.mul('10s', -1));

console.log('\n📋 div 函数');
console.log('10s / 2:', CyanTime.div('10s', 2));
console.log('15min / 1.5:', CyanTime.div('15min', 1.5));
console.log('4h / 2:', CyanTime.div('4h', 2));
console.log('-10s / 2:', CyanTime.div('-10s', 2));
try {
    console.log('10s / 0:', CyanTime.div('10s', 0));
} catch (e) {
    console.log('10s / 0: 正确抛出错误 -', (e as Error).message);
}

console.log('\n📋 compare 函数');
console.log('10s vs 5s:', CyanTime.compare('10s', '5s'));
console.log('5s vs 10s:', CyanTime.compare('5s', '10s'));
console.log('10s vs 10s:', CyanTime.compare('10s', '10s'));
console.log('1min vs 50s:', CyanTime.compare('1min', '50s'));
console.log('50s vs 1min:', CyanTime.compare('50s', '1min'));
console.log('1min vs 60s:', CyanTime.compare('1min', '60s'));
console.log('-5s vs -10s:', CyanTime.compare('-5s', '-10s'));

console.log('\n📋 timeStringToNum 函数');
console.log('10s ->', CyanTime.timeStringToNum('10s'));
console.log('5min ->', CyanTime.timeStringToNum('5min'));
console.log('2h ->', CyanTime.timeStringToNum('2h'));
console.log('1.5h ->', CyanTime.timeStringToNum('1.5h'));
console.log('-10s ->', CyanTime.timeStringToNum('-10s'));

console.log('\n📋 timeShow 函数');
console.log('10s ->', CyanTime.timeShow('10s'));
console.log('90s ->', CyanTime.timeShow('90s'));
console.log('90min ->', CyanTime.timeShow('90min'));
console.log('25h ->', CyanTime.timeShow('25h'));
console.log('0s ->', CyanTime.timeShow('0s'));
console.log('-10s ->', CyanTime.timeShow('-10s'));
console.log('90061001ms ->', CyanTime.timeShow('90061001ms'));

console.log('\n📋 综合场景');
const result1 = CyanTime.add('1h', CyanTime.mul('30min', 2));
console.log('1h + (30min * 2) =', result1);
const result2 = CyanTime.sub(CyanTime.convert('1day', 'h'), '6h');
console.log('(1day -> h) - 6h =', result2);
const timestamp = CyanTime.convert('0s', 'timestamp');
const back = CyanTime.convert(timestamp, 's');
console.log('时间戳往返: 0s -> timestamp ->', back);

console.log('\n📋 边界情况');
console.log('1ms -> ms:', CyanTime.convert('1ms', 'ms'));
console.log('1000year -> day:', CyanTime.convert('1000year', 'day'));
console.log('0s + 0s:', CyanTime.add('0s', '0s'));

console.log('\n🎉 测试完成！');

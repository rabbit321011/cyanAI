import * as CyanTime from './src/utility/time/cyan_time';

console.log('🚀 CyanTime 全面测试\n');

console.log('=== convert ===');
console.log('10s to ms:', CyanTime.convert('10s', 'ms'));
console.log('5min to s:', CyanTime.convert('5min', 's'));
console.log('2h to min:', CyanTime.convert('2h', 'min'));
console.log('1day to h:', CyanTime.convert('1day', 'h'));
console.log('1.5h to min:', CyanTime.convert('1.5h', 'min'));
console.log('-10s to ms:', CyanTime.convert('-10s', 'ms'));

console.log('\n=== add ===');
console.log('10s + 5s:', CyanTime.add('10s', '5s'));
console.log('1min + 30s:', CyanTime.add('1min', '30s'));
console.log('2h + 30min:', CyanTime.add('2h', '30min'));
console.log('1.5h + 0.5h:', CyanTime.add('1.5h', '0.5h'));

console.log('\n=== sub ===');
console.log('10s - 5s:', CyanTime.sub('10s', '5s'));
console.log('2min - 30s:', CyanTime.sub('2min', '30s'));
console.log('3h - 30min:', CyanTime.sub('3h', '30min'));

console.log('\n=== mul ===');
console.log('10s * 5:', CyanTime.mul('10s', 5));
console.log('10min * 1.5:', CyanTime.mul('10min', 1.5));
console.log('2h * 2:', CyanTime.mul('2h', 2));

console.log('\n=== div ===');
console.log('10s / 2:', CyanTime.div('10s', 2));
console.log('15min / 1.5:', CyanTime.div('15min', 1.5));
console.log('4h / 2:', CyanTime.div('4h', 2));
try { console.log('10s / 0:', CyanTime.div('10s', 0)); } catch(e) { console.log('10s / 0: 正确抛出错误'); }

console.log('\n=== compare ===');
console.log('10s vs 5s:', CyanTime.compare('10s', '5s'));
console.log('5s vs 10s:', CyanTime.compare('5s', '10s'));
console.log('10s vs 10s:', CyanTime.compare('10s', '10s'));
console.log('1min vs 50s:', CyanTime.compare('1min', '50s'));
console.log('1min vs 60s:', CyanTime.compare('1min', '60s'));

console.log('\n=== timeStringToNum ===');
console.log('10s:', CyanTime.timeStringToNum('10s'));
console.log('5min:', CyanTime.timeStringToNum('5min'));
console.log('2h:', CyanTime.timeStringToNum('2h'));
console.log('1.5h:', CyanTime.timeStringToNum('1.5h'));
console.log('-10s:', CyanTime.timeStringToNum('-10s'));

console.log('\n=== timeShow ===');
console.log('10s:', CyanTime.timeShow('10s'));
console.log('90s:', CyanTime.timeShow('90s'));
console.log('90min:', CyanTime.timeShow('90min'));
console.log('25h:', CyanTime.timeShow('25h'));
console.log('0s:', CyanTime.timeShow('0s'));
console.log('-10s:', CyanTime.timeShow('-10s'));

console.log('\n=== 综合测试 ===');
const r1 = CyanTime.add('1h', CyanTime.mul('30min', 2));
console.log('1h + (30min*2) =', r1);
const r2 = CyanTime.sub(CyanTime.convert('1day', 'h'), '6h');
console.log('(1day->h) - 6h =', r2);

console.log('\n🎉 测试完成！');

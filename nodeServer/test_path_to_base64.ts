import { path_to_base64 } from './src/component/escaper/path_to_base64';
import { readFileSync } from 'fs';

// 读取测试文件内容
const testContent = readFileSync('./test/test_datas/test_message_text.txt', 'utf-8');
console.log('原始内容:', testContent);

// 测试转换
const result = path_to_base64(testContent);
console.log('转换后内容:', result);

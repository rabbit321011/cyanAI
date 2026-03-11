import { writeIni } from '../../src/utility/file_operation/write_ini';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';
import fs from 'fs';

async function testWriteIni() {
    console.log('=== 测试 writeIni 函数 ===\n');
    
    const testFile = path.join(__dirname, 'test_write.ini');
    
    // 清理旧文件
    if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
    }
    
    // 测试多次写入
    console.log('1. 第一次写入 key1=value1');
    writeIni(testFile, 'key1', 'value1');
    console.log('文件内容:', fs.readFileSync(testFile, 'utf-8'));
    
    console.log('\n2. 第二次写入 key2=value2');
    writeIni(testFile, 'key2', 'value2');
    console.log('文件内容:', fs.readFileSync(testFile, 'utf-8'));
    
    console.log('\n3. 第三次写入 key3=value3');
    writeIni(testFile, 'key3', 'value3');
    console.log('文件内容:', fs.readFileSync(testFile, 'utf-8'));
    
    console.log('\n4. 验证读取');
    console.log('key1:', readIni(testFile, 'key1'));
    console.log('key2:', readIni(testFile, 'key2'));
    console.log('key3:', readIni(testFile, 'key3'));
    
    // 清理
    fs.unlinkSync(testFile);
    
    console.log('\n=== 测试完成 ===');
}

testWriteIni().catch(console.error);

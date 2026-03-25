import { uploadToCatbox } from '../../src/utility/catbox/catbox';
import fs from 'fs';
import path from 'path';

async function testCatbox() {
    console.log('=== Catbox 上传测试 ===');
    
    const testDir = path.join(__dirname);
    const testFile = path.join(testDir, 'test_upload.txt');
    
    fs.writeFileSync(testFile, '这是一个测试文件，用于测试 Catbox 上传功能。\n测试时间: ' + new Date().toISOString());
    
    console.log(`测试文件: ${testFile}`);
    console.log(`文件大小: ${fs.statSync(testFile).size} bytes`);
    
    console.log('\n开始上传...');
    const startTime = Date.now();
    
    const result = await uploadToCatbox(testFile);
    
    const elapsed = Date.now() - startTime;
    console.log(`耗时: ${elapsed}ms`);
    
    if (result) {
        console.log(`\n✅ 上传成功!`);
        console.log(`文件URL: ${result}`);
    } else {
        console.log(`\n❌ 上传失败`);
    }
    
    fs.unlinkSync(testFile);
    console.log('\n测试文件已清理');
}

testCatbox().catch(console.error);

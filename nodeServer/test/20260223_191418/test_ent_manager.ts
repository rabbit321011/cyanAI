import * as path from 'path';
import * as fs from 'fs';
import {
  getEntry,
  updateEntry,
  getEntryCount,
  appendEntry,
  findEntryLineByCurrent,
  CyanEntry,
  MemoryState
} from '../../src/utility/ent_operation/ent_manager';

const testFilePath = path.join(__dirname, 'test.ent');

function getCurrentTimestamp(): string {
  const now = new Date();
  const Y = now.getFullYear().toString().padStart(4, '0');
  const M = (now.getMonth() + 1).toString().padStart(2, '0');
  const D = now.getDate().toString().padStart(2, '0');
  const H = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${Y}${M}${D}_${H}${m}${s}`;
}

function createTestEntry(index: number, currentText: string): CyanEntry {
  const memoryState: MemoryState = {
    R: index * 10,
    S: index * 20,
    last_T_distance: `${index}s`,
    D: index * 5,
    a: index
  };

  return {
    memory_state: memoryState,
    current: currentText,
    extraCurrent: { testData: `data_${index}` },
    TIMESET: getCurrentTimestamp()
  };
}

function cleanupTestFile() {
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ 测试失败: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('========================================');
  console.log('开始测试 ent_manager.ts');
  console.log('========================================\n');

  try {
    cleanupTestFile();

    console.log('--- 测试 1: 空文件的条目计数 ---');
    assert(getEntryCount(testFilePath) === 0, '空文件条目数应该为 0');

    console.log('\n--- 测试 2: 追加第一条目 ---');
    const entry1 = createTestEntry(1, 'Hello World');
    appendEntry(testFilePath, entry1);
    assert(getEntryCount(testFilePath) === 1, '追加后条目数应该为 1');

    console.log('\n--- 测试 3: 读取第一条目 ---');
    const readEntry1 = getEntry(testFilePath, 1);
    assert(readEntry1.current === 'Hello World', '读取的 current 应该匹配');
    assert(readEntry1.memory_state.R === 10, '读取的 R 值应该为 10');

    console.log('\n--- 测试 4: 追加多条目 ---');
    const entry2 = createTestEntry(2, 'Test Message 2');
    const entry3 = createTestEntry(3, 'Test Message 3');
    appendEntry(testFilePath, entry2);
    appendEntry(testFilePath, entry3);
    assert(getEntryCount(testFilePath) === 3, '追加后条目数应该为 3');

    console.log('\n--- 测试 5: 更新条目 ---');
    const updatedEntry2 = createTestEntry(99, 'Updated Message');
    updateEntry(testFilePath, 2, updatedEntry2);
    const readUpdated = getEntry(testFilePath, 2);
    assert(readUpdated.current === 'Updated Message', '更新后的 current 应该匹配');
    assert(readUpdated.memory_state.R === 990, '更新后的 R 值应该为 990');

    console.log('\n--- 测试 6: 按 current 查找条目 ---');
    const lineNum = findEntryLineByCurrent(testFilePath, 'Hello World');
    assert(lineNum === 1, '应该能找到第一条目');
    
    const notFound = findEntryLineByCurrent(testFilePath, 'Non Existent');
    assert(notFound === -1, '不存在的内容应该返回 -1');

    console.log('\n--- 测试 7: 越界读取应该抛出错误 ---');
    let errorThrown = false;
    try {
      getEntry(testFilePath, 999);
    } catch (e) {
      errorThrown = true;
    }
    assert(errorThrown, '越界读取应该抛出错误');

    console.log('\n--- 测试 8: 越界更新应该抛出错误 ---');
    errorThrown = false;
    try {
      updateEntry(testFilePath, 999, entry1);
    } catch (e) {
      errorThrown = true;
    }
    assert(errorThrown, '越界更新应该抛出错误');

    console.log('\n--- 测试 9: 序号小于 1 应该抛出错误 ---');
    errorThrown = false;
    try {
      getEntry(testFilePath, 0);
    } catch (e) {
      errorThrown = true;
    }
    assert(errorThrown, '序号 0 应该抛出错误');

    console.log('\n--- 测试 10: 测试特殊字符转义 ---');
    const specialEntry = createTestEntry(4, 'Line 1\nLine 2\tWith "quotes"');
    appendEntry(testFilePath, specialEntry);
    const readSpecial = getEntry(testFilePath, 4);
    assert(readSpecial.current === 'Line 1\nLine 2\tWith "quotes"', '特殊字符应该正确转义');

    console.log('\n========================================');
    console.log('🎉 所有测试通过!');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    throw error;
  } finally {
    cleanupTestFile();
  }
}

runTests().catch(console.error);

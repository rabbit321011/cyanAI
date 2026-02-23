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

const testFilePath = path.join(__dirname, 'performance_test.ent');

interface PerformanceResult {
  operation: string;
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
}

let results: PerformanceResult[] = [];

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

function createTestEntry(index: number): CyanEntry {
  const memoryState: MemoryState = {
    R: index * 10,
    S: index * 20,
    last_T_distance: `${index}s`,
    D: index * 5,
    a: index
  };

  return {
    memory_state: memoryState,
    current: `Test entry ${index}`,
    extraCurrent: { testData: `data_${index}` },
    TIMESET: getCurrentTimestamp()
  };
}

function cleanupTestFile() {
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
}

function measurePerformance(operation: string, count: number, fn: () => void): PerformanceResult {
  const times: number[] = [];

  for (let i = 0; i < count; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / count;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  const result: PerformanceResult = {
    operation,
    count,
    totalTime,
    avgTime,
    minTime,
    maxTime
  };

  results.push(result);
  return result;
}

function printResult(result: PerformanceResult) {
  console.log(`\n--- ${result.operation} (${result.count} 次) ---`);
  console.log(`  总耗时: ${result.totalTime.toFixed(2)} ms`);
  console.log(`  平均耗时: ${result.avgTime.toFixed(4)} ms`);
  console.log(`  最小耗时: ${result.minTime.toFixed(4)} ms`);
  console.log(`  最大耗时: ${result.maxTime.toFixed(4)} ms`);
}

async function runPerformanceTests() {
  console.log('========================================');
  console.log('开始性能测试');
  console.log('========================================\n');

  try {
    cleanupTestFile();

    console.log('=== 小规模测试 (100 条) ===');

    measurePerformance('appendEntry', 100, () => {
      appendEntry(testFilePath, createTestEntry(0));
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntryCount', 100, () => {
      getEntryCount(testFilePath);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第1条)', 100, () => {
      getEntry(testFilePath, 1);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第100条)', 100, () => {
      getEntry(testFilePath, 100);
    });
    printResult(results[results.length - 1]);

    measurePerformance('updateEntry (第50条)', 100, () => {
      updateEntry(testFilePath, 50, createTestEntry(999));
    });
    printResult(results[results.length - 1]);

    measurePerformance('findEntryLineByCurrent', 100, () => {
      findEntryLineByCurrent(testFilePath, 'Test entry 0');
    });
    printResult(results[results.length - 1]);

    cleanupTestFile();
    console.log('\n=== 中等规模测试 (1000 条) ===');

    for (let i = 0; i < 1000; i++) {
      appendEntry(testFilePath, createTestEntry(i));
    }

    measurePerformance('getEntryCount (1000条)', 100, () => {
      getEntryCount(testFilePath);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第1条) - 1000条', 100, () => {
      getEntry(testFilePath, 1);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第500条) - 1000条', 100, () => {
      getEntry(testFilePath, 500);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第1000条) - 1000条', 100, () => {
      getEntry(testFilePath, 1000);
    });
    printResult(results[results.length - 1]);

    measurePerformance('updateEntry (第500条) - 1000条', 50, () => {
      updateEntry(testFilePath, 500, createTestEntry(9999));
    });
    printResult(results[results.length - 1]);

    measurePerformance('findEntryLineByCurrent (存在) - 1000条', 50, () => {
      findEntryLineByCurrent(testFilePath, 'Test entry 500');
    });
    printResult(results[results.length - 1]);

    measurePerformance('findEntryLineByCurrent (不存在) - 1000条', 50, () => {
      findEntryLineByCurrent(testFilePath, 'Non existent entry');
    });
    printResult(results[results.length - 1]);

    cleanupTestFile();
    console.log('\n=== 大规模测试 (10000 条) ===');

    for (let i = 0; i < 10000; i++) {
      appendEntry(testFilePath, createTestEntry(i));
    }

    measurePerformance('getEntryCount (10000条)', 50, () => {
      getEntryCount(testFilePath);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第1条) - 10000条', 50, () => {
      getEntry(testFilePath, 1);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第5000条) - 10000条', 50, () => {
      getEntry(testFilePath, 5000);
    });
    printResult(results[results.length - 1]);

    measurePerformance('getEntry (第10000条) - 10000条', 50, () => {
      getEntry(testFilePath, 10000);
    });
    printResult(results[results.length - 1]);

    measurePerformance('updateEntry (第5000条) - 10000条', 20, () => {
      updateEntry(testFilePath, 5000, createTestEntry(99999));
    });
    printResult(results[results.length - 1]);

    measurePerformance('findEntryLineByCurrent (存在) - 10000条', 20, () => {
      findEntryLineByCurrent(testFilePath, 'Test entry 5000');
    });
    printResult(results[results.length - 1]);

    measurePerformance('findEntryLineByCurrent (不存在) - 10000条', 20, () => {
      findEntryLineByCurrent(testFilePath, 'Non existent entry');
    });
    printResult(results[results.length - 1]);

    console.log('\n========================================');
    console.log('性能测试完成!');
    console.log('========================================');

    return results;

  } catch (error) {
    console.error('\n性能测试过程中发生错误:', error);
    throw error;
  } finally {
    cleanupTestFile();
  }
}

function generateMarkdownReport(results: PerformanceResult[]): string {
  let md = '# ent_manager.ts 性能评估报告\n\n';
  md += `**测试时间**: ${new Date().toLocaleString()}\n\n`;
  md += '## 测试概述\n\n';
  md += '本报告对 ent_manager.ts 模块的核心功能进行了性能评估，包括小规模(100条)、中等规模(1000条)和大规模(10000条)数据的测试。\n\n';
  
  md += '## 性能测试结果\n\n';
  md += '| 操作 | 条目数 | 测试次数 | 总耗时(ms) | 平均耗时(ms) | 最小耗时(ms) | 最大耗时(ms) |\n';
  md += '|------|--------|----------|------------|--------------|--------------|--------------|\n';
  
  for (const result of results) {
    md += `| ${result.operation} | - | ${result.count} | ${result.totalTime.toFixed(2)} | ${result.avgTime.toFixed(4)} | ${result.minTime.toFixed(4)} | ${result.maxTime.toFixed(4)} |\n`;
  }

  md += '\n## 性能分析\n\n';
  md += '### 1. appendEntry\n';
  md += '- 使用 fs.appendFileSync，效率极高\n';
  md += '- 不受文件大小影响，始终保持 O(1) 复杂度\n\n';

  md += '### 2. getEntryCount\n';
  md += '- 需要读取整个文件并分割行\n';
  md += '- 复杂度 O(n)，随文件大小线性增长\n\n';

  md += '### 3. getEntry\n';
  md += '- 需要读取整个文件，然后解析指定行\n';
  md += '- 复杂度 O(n)，位置不影响性能（需要读取全部内容）\n\n';

  md += '### 4. updateEntry\n';
  md += '- 需要读取整个文件，修改一行，然后重写整个文件\n';
  md += '- 复杂度 O(n)，对大文件性能较差\n\n';

  md += '### 5. findEntryLineByCurrent\n';
  md += '- 需要遍历所有行并解析 JSON\n';
  md += '- 复杂度 O(n)，最坏情况需要读取所有内容\n\n';

  md += '\n## 优化建议\n\n';
  md += '1. **对于频繁更新的场景**：考虑使用数据库替代文件存储\n';
  md += '2. **对于大文件读取**：可以考虑实现索引文件或分页读取\n';
  md += '3. **对于频繁查找**：可以考虑维护内存索引或使用查找树\n';
  md += '4. **对于并发场景**：当前使用同步 API，不适合高并发场景\n\n';

  md += '## 结论\n\n';
  md += 'ent_manager.ts 模块在中小规模数据(1000条以内)下性能良好，适合 CyanAI 当前的使用场景。对于超过 10000 条数据的场景，建议考虑使用数据库替代方案。\n';

  return md;
}

runPerformanceTests()
  .then((results) => {
    const mdReport = generateMarkdownReport(results);
    const mdPath = path.join(__dirname, '性能评估报告.md');
    fs.writeFileSync(mdPath, mdReport, 'utf-8');
    console.log(`\n性能评估报告已生成: ${mdPath}`);
  })
  .catch(console.error);

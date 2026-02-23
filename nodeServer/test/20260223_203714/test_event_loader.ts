import * as fs from 'fs';
import * as path from 'path';

const realEventFolder = 'E:\\MyProject\\cyanAI\\dataBase\\events';
const realSummaryFolder = 'E:\\MyProject\\cyanAI\\dataBase\\event_summary';
const testFilePrefix = 'test_event_';

function getTestTimestamp(daysAgo: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const Y = d.getUTCFullYear().toString().padStart(4, '0');
  const M = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const D = d.getUTCDate().toString().padStart(2, '0');
  const H = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  const s = d.getUTCSeconds().toString().padStart(2, '0');
  return `${Y}${M}${D}_${H}${m}${s}`;
}

function createTestEventFile(filePath: string, entryCount: number): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let content = '';
  for (let i = 1; i <= entryCount; i++) {
    const entry = {
      memory_state: {
        R: 0.5,
        S: 10,
        last_T_distance: '10s',
        D: 5,
        a: 1
      },
      current: `Event entry ${i}`,
      extraCurrent: {},
      TIMESET: getTestTimestamp()
    };
    content += JSON.stringify(entry) + '\n';
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

function createTestSummaryFile(
  fileName: string,
  R: number,
  Im: number,
  daysAgo: number,
  eventEntryCount: number
): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const Y = date.getFullYear().toString();
  const M = (date.getMonth() + 1).toString().padStart(2, '0');
  const D = date.getDate().toString().padStart(2, '0');

  const summaryDir = path.join(realSummaryFolder, Y, M, D);
  const eventDir = path.join(realEventFolder, Y, M, D);
  
  const summaryPath = path.join(summaryDir, fileName);
  const eventPath = path.join(eventDir, fileName);

  createTestEventFile(eventPath, eventEntryCount);

  const entry = {
    memory_state: {
      R: R,
      S: 10,
      last_T_distance: '10s',
      D: 5,
      a: 1
    },
    current: `Test event (R=${R}, Im=${Im}, ${daysAgo} days ago)`,
    extraCurrent: {
      Im: Im
    },
    TIMESET: getTestTimestamp(daysAgo)
  };

  const summaryDirCheck = path.dirname(summaryPath);
  if (!fs.existsSync(summaryDirCheck)) {
    fs.mkdirSync(summaryDirCheck, { recursive: true });
  }

  fs.writeFileSync(summaryPath, JSON.stringify(entry) + '\n', 'utf-8');
  return summaryPath;
}

function cleanupTestData(): void {
  console.log('--- 清理测试数据 ---');
  
  function deleteTestFiles(dir: string): void {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        deleteTestFiles(fullPath);
        try {
          fs.rmdirSync(fullPath);
        } catch (e) {}
      } else if (file.startsWith(testFilePrefix)) {
        fs.unlinkSync(fullPath);
        console.log(`  删除: ${fullPath}`);
      }
    }
  }

  deleteTestFiles(realEventFolder);
  deleteTestFiles(realSummaryFolder);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`❌ 测试失败: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log('========================================');
  console.log('开始测试 event_loader.ts（扩大测试规模，不删除文件）');
  console.log('========================================\n');

  try {
    cleanupTestData();

    console.log('--- 创建大规模测试数据到真实 dataBase ---\n');
    
    console.log('📁 测试场景 1: 近期高权重事件');
    createTestSummaryFile(`${testFilePrefix}high_recent_1.ent`, 1.0, 10, 0, 50);
    createTestSummaryFile(`${testFilePrefix}high_recent_2.ent`, 0.95, 9, 1, 45);
    createTestSummaryFile(`${testFilePrefix}high_recent_3.ent`, 0.9, 8, 2, 40);
    createTestSummaryFile(`${testFilePrefix}high_recent_4.ent`, 0.85, 7, 3, 35);
    createTestSummaryFile(`${testFilePrefix}high_recent_5.ent`, 0.8, 6, 4, 30);
    
    console.log('📁 测试场景 2: 中期中等权重事件');
    createTestSummaryFile(`${testFilePrefix}mid_medium_1.ent`, 0.7, 5, 7, 25);
    createTestSummaryFile(`${testFilePrefix}mid_medium_2.ent`, 0.65, 6, 10, 20);
    createTestSummaryFile(`${testFilePrefix}mid_medium_3.ent`, 0.6, 7, 14, 18);
    createTestSummaryFile(`${testFilePrefix}mid_medium_4.ent`, 0.55, 5, 21, 15);
    createTestSummaryFile(`${testFilePrefix}mid_medium_5.ent`, 0.5, 4, 30, 12);
    
    console.log('📁 测试场景 3: 远期低权重事件');
    createTestSummaryFile(`${testFilePrefix}far_low_1.ent`, 0.45, 3, 45, 10);
    createTestSummaryFile(`${testFilePrefix}far_low_2.ent`, 0.4, 2, 60, 8);
    createTestSummaryFile(`${testFilePrefix}far_low_3.ent`, 0.35, 3, 90, 6);
    createTestSummaryFile(`${testFilePrefix}far_low_4.ent`, 0.3, 2, 120, 5);
    createTestSummaryFile(`${testFilePrefix}far_low_5.ent`, 0.25, 1, 180, 3);
    
    console.log('📁 测试场景 4: 单条目事件（边界情况）');
    createTestSummaryFile(`${testFilePrefix}single_1.ent`, 1.0, 10, 0, 1);
    createTestSummaryFile(`${testFilePrefix}single_2.ent`, 0.5, 5, 5, 1);
    createTestSummaryFile(`${testFilePrefix}single_3.ent`, 0.1, 1, 100, 1);
    
    console.log('📁 测试场景 5: 大型事件文件');
    createTestSummaryFile(`${testFilePrefix}large_1.ent`, 0.9, 10, 0, 100);
    createTestSummaryFile(`${testFilePrefix}large_2.ent`, 0.8, 8, 5, 200);
    createTestSummaryFile(`${testFilePrefix}large_3.ent`, 0.7, 6, 10, 500);
    
    console.log('📁 测试场景 6: 混合权重分布');
    createTestSummaryFile(`${testFilePrefix}mixed_1.ent`, 1.0, 1, 0, 10);
    createTestSummaryFile(`${testFilePrefix}mixed_2.ent`, 0.1, 10, 0, 10);
    createTestSummaryFile(`${testFilePrefix}mixed_3.ent`, 0.5, 5, 0, 10);

    console.log('\n--- 导入并测试 loadInitialEvents ---');
    const { loadInitialEvents } = await import('../../src/component/events/event_loader');
    
    const result = loadInitialEvents();
    
    assert(Array.isArray(result), '返回结果应该是数组');
    
    console.log(`\n📊 共加载了 ${result.length} 个事件`);
    
    if (result.length > 0) {
      console.log('\n--- 前 3 个事件的完整对象示例 ---');
      for (let i = 0; i < Math.min(3, result.length); i++) {
        console.log(`\n📌 事件 ${i + 1}:`);
        console.log(JSON.stringify(result[i], null, 2));
      }
    }
    
    console.log('\n--- 验证所有事件 ---');
    let highWeightCount = 0;
    let mediumWeightCount = 0;
    let lowWeightCount = 0;
    
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      assert(item.source !== undefined, `事件 ${i + 1} 应该有 source`);
      assert(item.current !== undefined, `事件 ${i + 1} 应该有 current`);
      assert(item.source.path !== undefined, `事件 ${i + 1} 的 source 应该有 path`);
      assert(item.source.reference !== undefined, `事件 ${i + 1} 的 source 应该有 reference`);
      assert(item.source.reference.length > 0, `事件 ${i + 1} 的 reference 应该不为空`);
      
      const ref = item.source.reference[0];
      assert(ref.start === '1', `事件 ${i + 1} 的 start 应该是 '1'`);
      assert(ref.end !== 'EOF', `事件 ${i + 1} 的 end 不应该是 'EOF'`);
      assert(!isNaN(parseInt(ref.end)), `事件 ${i + 1} 的 end 应该是数字`);
      
      const entryCount = parseInt(ref.end);
      if (entryCount > 50) highWeightCount++;
      else if (entryCount > 10) mediumWeightCount++;
      else lowWeightCount++;
      
      if (i < 5) {
        console.log(`\n  ✅ 事件 ${i + 1}: "${item.current.substring(0, 60)}..."`);
        console.log(`     路径: ${item.source.path}`);
        console.log(`     条目范围: ${ref.start}-${ref.end} (共 ${ref.end} 条)`);
      }
    }
    
    console.log(`\n📈 统计信息:`);
    console.log(`  - 大型文件 (>50条): ${highWeightCount} 个`);
    console.log(`  - 中型文件 (11-50条): ${mediumWeightCount} 个`);
    console.log(`  - 小型文件 (1-10条): ${lowWeightCount} 个`);

    console.log('\n========================================');
    console.log('🎉 所有测试通过! 文件保留在 dataBase 中供查看');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    throw error;
  }
}

runTests().catch(console.error);

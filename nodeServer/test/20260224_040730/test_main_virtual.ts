import * as fs from 'fs';
import * as path from 'path';

async function runTest() {
  console.log('========================================');
  console.log('开始测试 main_virtual.ts - 两种模式');
  console.log('========================================\n');

  const statusPath = path.join(__dirname, '../../core_datas/main_virtual/main_virtual.status');

  try {
    console.log('--- 步骤 1: 删除现有状态文件（测试新建模式）---');
    if (fs.existsSync(statusPath)) {
      fs.unlinkSync(statusPath);
      console.log('✅ 已删除现有状态文件\n');
    } else {
      console.log('ℹ️ 状态文件不存在，跳过删除\n');
    }

    console.log('--- 步骤 2: 导入并测试新建模式 ---');
    const module = await import('../../src/component/process/main_virtual');
    
    const result1 = module.getCoreStateForFile('test');
    console.log(`✅ 新建模式执行完成，返回值: ${result1}\n`);

    console.log('--- 步骤 3: 读取并显示生成的状态文件 ---');
    if (fs.existsSync(statusPath)) {
      const statusContent = fs.readFileSync(statusPath, 'utf-8');
      const statusObject = JSON.parse(statusContent);
      
      console.log('\n📋 状态文件内容（格式化）:');
      console.log('────────────────────────────────────────');
      
      console.log('\n【system.main_prompt】');
      console.log('────────────────────────────────────────');
      console.log(statusObject.system.main_prompt.substring(0, 500) + '...');
      
      console.log('\n【system.character_reference】');
      console.log('────────────────────────────────────────');
      console.log(statusObject.system.character_reference || '(空)');
      
      console.log('\n【system.events】');
      console.log('────────────────────────────────────────');
      const eventsPreview = statusObject.system.events.split('\n').slice(0, 5).join('\n');
      console.log(eventsPreview + '\n... (更多事件已省略)');
      
      console.log('\n【其他字段】');
      console.log('────────────────────────────────────────');
      console.log(`- workspace: ${statusObject.system.workspace.length} 项`);
      console.log(`- object_network.objects: ${statusObject.system.object_network.objects.length} 项`);
      console.log(`- object_network.relative: ${statusObject.system.object_network.relative.length} 项`);
      console.log(`- pulled_info: ${statusObject.system.pulled_info.length} 项`);
      console.log(`- step_progress: ${statusObject.system.step_progress.length} 项`);
      console.log(`- context: ${statusObject.context.length} 项`);
      
      console.log('\n────────────────────────────────────────\n');
    } else {
      console.log('❌ 状态文件未生成\n');
    }

    console.log('--- 步骤 4: 测试读取模式 ---');
    const result2 = module.getCoreStateForFile('test');
    console.log(`✅ 读取模式执行完成，返回值: ${result2}\n`);

    console.log('========================================');
    console.log('🎉 所有测试完成!');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    throw error;
  }
}

runTest().catch(console.error);

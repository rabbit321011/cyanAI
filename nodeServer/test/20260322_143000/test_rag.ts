/**
 * RAG 和 Reranker 功能测试
 *
 * 测试以下功能：
 * 1. embed - 文本向量化
 * 2. insert - 插入数据
 * 3. topk - Top-K 搜索
 * 4. clear_table - 清空指定表
 * 5. reranker - 重排序评分
 */

import { embed, insert, topk, clear_table } from '../../src/utility/RAG/RAG';
import { reranker } from '../../src/utility/reranker';

async function testRagReranker() {
    console.log('='.repeat(50));
    console.log('开始测试 RAG 和 Reranker 功能');
    console.log('='.repeat(50));

    try {
        // 1. 测试 embed - 文本向量化
        console.log('\n【测试 1】embed - 文本向量化');
        console.log('-'.repeat(30));
        const queryText = '什么是人工智能？';
        const vector = await embed(queryText);
        console.log('✅ embed 成功');
        console.log('输入文本:', queryText);
        console.log('向量长度:', vector.length);
        console.log('向量前 50 个字符:', vector.substring(0, 50) + '...');

        // 2. 测试 insert - 插入数据
        console.log('\n【测试 2】insert - 插入数据');
        console.log('-'.repeat(30));
        const testVector = await embed('人工智能是计算机科学的一个重要分支');
        const dataStr = JSON.stringify({
            title: '人工智能定义',
            content: '人工智能是计算机科学的一个分支，致力于开发能够执行通常需要人类智能的任务的计算机系统。'
        });
        await insert('temp', testVector, dataStr);
        console.log('✅ insert 成功');
        console.log('插入表: temp');
        console.log('数据:', dataStr);

        // 3. 测试 topk - Top-K 搜索
        console.log('\n【测试 3】topk - Top-K 搜索');
        console.log('-'.repeat(30));
        const searchVector = await embed('计算机科学');
        const results = await topk(['temp'], searchVector, 3);
        console.log('✅ topk 成功');
        console.log('搜索结果数量:', results.length);
        results.forEach((res, index) => {
            const data = JSON.parse(res);
            console.log(`结果 ${index + 1}:`, data.title);
        });

        // 4. 测试 reranker - 重排序
        console.log('\n【测试 4】reranker - 重排序');
        console.log('-'.repeat(30));
        const query = '机器学习相关内容';
        const targets = [
            '人工智能是计算机科学的一个分支',
            '今天天气很好，适合外出游玩',
            '机器学习是人工智能的一个重要子领域',
            '深度学习是机器学习的一个分支',
            '烹饪美食是一门艺术'
        ];
        const scores = await reranker(query, targets);
        console.log('✅ reranker 成功');

        // 按分数排序显示结果
        const scoredResults = targets
            .map((text, index) => ({ text, score: scores[index] }))
            .sort((a, b) => b.score - a.score);

        console.log('查询:', query);
        console.log('相关性分数 (从高到低):');
        scoredResults.forEach((item, index) => {
            console.log(`  ${index + 1}. [${item.score.toFixed(4)}] ${item.text}`);
        });

        // 5. 测试 clear_table - 清空指定表
        console.log('\n【测试 5】clear_table - 清空指定表');
        console.log('-'.repeat(30));
        await clear_table('temp');
        console.log('✅ clear_table 成功');
        console.log('已清空 temp 表');

        // 验证清空后搜索不到结果
        const emptyResults = await topk(['temp'], searchVector, 3);
        console.log('清空后搜索结果数量:', emptyResults.length);

        console.log('\n' + '='.repeat(50));
        console.log('🎉 所有测试通过!');
        console.log('='.repeat(50));

    } catch (error: any) {
        console.error('\n❌ 测试失败:');
        console.error('错误信息:', error.message);
        console.error('详细错误:', error);
        process.exit(1);
    }
}

testRagReranker();
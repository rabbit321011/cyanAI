import { reranker } from '../../src/utility/reranker/reranker';
import * as path from 'path';
import { readIni } from '../../src/utility/file_operation/read_ini';

const INI_FILE_PATH = path.join(__dirname, '../../library_source.ini');

function getLocalApiUrl(): string {
    try {
        const apiUrl = readIni(INI_FILE_PATH, 'local_api_url');
        return apiUrl || 'http://localhost:3723';
    } catch {
        return 'http://localhost:3723';
    }
}

async function testRerankerSpeed() {
    const testCount = 20;
    
    const query = "人工智能技术在现代社会中的应用越来越广泛，从医疗诊断到自动驾驶，从智能家居到金融分析，无处不在改变着我们的生活方式。";
    
    const docs = [
        "人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大，可以设想，未来人工智能带来的科技产品，将会是人类智慧的容器。",
        "机器学习是人工智能的一个重要分支，它使计算机系统能够从数据中学习并改进，而无需进行明确的编程。机器学习算法使用历史数据作为输入来预测新的输出值。推荐系统、垃圾邮件过滤、欺诈检测等都是机器学习的常见应用。深度学习是机器学习的一个子集，它使用人工神经网络来模拟人脑的工作方式。",
        "自然语言处理是人工智能和语言学的交叉领域，致力于让计算机理解和生成人类语言。NLP的应用包括机器翻译、情感分析、聊天机器人、语音识别等。随着深度学习技术的发展，NLP取得了显著的进步，如BERT、GPT等模型的出现大大提升了自然语言处理的能力。",
        "计算机视觉是人工智能的另一个重要领域，它使计算机能够从图像或视频中获取信息。应用包括人脸识别、物体检测、自动驾驶、医学影像分析等。卷积神经网络是计算机视觉中最常用的深度学习架构，它在图像分类、目标检测等任务上取得了突破性的成果。",
        "强化学习是一种机器学习方法，通过智能体与环境的交互来学习最优策略。智能体通过尝试不同的动作并获得奖励或惩罚来学习。强化学习在游戏AI、机器人控制、推荐系统等领域有广泛应用。AlphaGo就是强化学习的著名应用案例。",
        "人工智能伦理是研究AI技术对社会影响的重要领域。随着AI技术的快速发展，隐私保护、算法偏见、就业影响等问题日益突出。制定合理的AI伦理准则和法规，确保AI技术的负责任发展，已成为全球关注的焦点。各国政府和组织正在积极推动AI治理框架的建立。"
    ];
    
    const apiUrl = getLocalApiUrl();
    console.log(`API 地址: ${apiUrl}`);
    console.log(`开始测试 reranker 性能...`);
    console.log(`测试次数: ${testCount}`);
    console.log(`Query 长度: ${query.length} 字`);
    console.log(`Docs 数量: ${docs.length} 个，平均长度: ${Math.round(docs.reduce((a, b) => a + b.length, 0) / docs.length)} 字`);
    console.log('---');
    
    const times: number[] = [];
    const startTime = Date.now();
    
    for (let i = 0; i < testCount; i++) {
        const iterStart = Date.now();
        try {
            const scores = await reranker(query, docs);
            const iterTime = Date.now() - iterStart;
            times.push(iterTime);
            
            if ((i + 1) % 20 === 0) {
                console.log(`进度: ${i + 1}/${testCount}, 本次耗时: ${iterTime}ms`);
            }
        } catch (error) {
            console.error(`第 ${i + 1} 次测试失败:`, error);
            break;
        }
    }
    
    const totalTime = Date.now() - startTime;
    
    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const medianTime = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
        
        console.log('\n=== 测试结果 ===');
        console.log(`成功次数: ${times.length}/${testCount}`);
        console.log(`总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
        console.log(`平均耗时: ${avgTime.toFixed(2)}ms`);
        console.log(`中位数耗时: ${medianTime}ms`);
        console.log(`最小耗时: ${minTime}ms`);
        console.log(`最大耗时: ${maxTime}ms`);
        console.log(`QPS: ${(1000 / avgTime).toFixed(2)}`);
    }
}

testRerankerSpeed().catch(console.error);

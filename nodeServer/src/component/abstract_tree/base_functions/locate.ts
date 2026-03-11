/*
本文件是用来操作和筛选内存中的抽象树的
locate.ts暴露函数id_locate用来通过文本id定位
locate.ts暴露函数auto_locate,rag_locate,full_assessment_locate,choice_locate
    这些函数的设计初衷都包含一个检索target对象，target对象包含：
        {
            target_name:string,//一个描述对象的名字
            target_description:string//一个描述对象的大致内容，大概是一个70字以内的字符串
        }

    rag_locate有参数output_count = 1,filter_count = 40 ,rag_min_score = 0.1 ,use_reranker = true ,reranker_count = 20,reranker_min_score = 0.5
    首先，会将整个树拿出来，先通过rag筛选前filter_count的对象，再去掉rag得分小于rag_min_score的对象，如果use_reranker===true
    则会将筛选后的对象进行reranker,先拿出得分在前reranker_count的对象，再把这些对象中reranker得分小于reranker_min_score的去掉
    得到的对象的原始文本加上索引(index)后，调用deepseek来筛选出前output_count的对象，要求如果两个对象都能描述，优先输出比较具体的节点
    如果一个对象的父对象可以更好的描述，且子节点不是比较适合，则优先输出父对象
    如果给deepseek的对象间有父子关系，则不给deepseek父节点
    子节点必然附带父节点的所有信息，deepseek可以选择输出父节点

    full_assessment_locate有参数output_count = 1,min_R = 0
    其的运作方式是，先筛选出综合R值大于等于min_R的节点
    从子节点开始，每个节点评估自己适不适合提交，如果适合，那么把自己提交到父节点
    节点作为父节点也需要把全部的子节点的结果和自身也提交给模型判断
    父节点的min_R一定大于子节点，因为实际R = 父节点的实际R * 自己的R占比
    提交的数量正是output_count,最后到根节点后，唯一的根节点的提交的output_count个节点就是最终的值

    choice_locate有参数output_count = 1 (这个参数必须为1), subnode_count = 128
    其会从根节点开始挨个选择，其会通过subnode_count决定每次看见的节点数
*/
import { abstruct_node } from "../data_structure/abstruct_tree_types";
export function id_locate(node_id:string,source_nodes:abstruct_node[])//读取的是dataBase\abstruct_tree\root下的文件，文件格式是JSON
{
    //遍历
    let output_node:abstruct_node|null = null;
    source_nodes.map((curr)=>{
        if(curr.id === node_id)
        {
            if(output_node === null)
                output_node = curr
            else
                console.error("在检索:"+node_id+" 时,检索到了多个对象,以第一个为准。")
        }
    })
    if(output_node === null)
        console.error("没有检索到对象；" + node_id + " ,所以输出了null")
    return output_node
}
export interface target_abstructTreeNode{
    target_name:string,
    target_description:string
}

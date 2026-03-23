export interface abstruct_node{
    id:string,//id是一个node决定自身独一无二性的东西，一般直接是名字
    parent_node_id:string,
    parent_theory_id:string[],
    subnodes_id:string[]
}
//这也会存在dataBase\abstruct_tree\root下，文件格式是JSON
//是文件夹格式，名字即id.每个node占一个文件夹，然后同文件夹名.json存储节点的是本节点的内容，然后其有其子文件夹作为子节点
//而tree本身是通过一个数组来实现的，载入程序内存的部分
export interface extra_anaphora_node{
    id:string | string[],//指代的原对象id，可以是单个或多个
    relation:string//取值可以为:
    /*
        self//指节点自身
        sub//指节点的子节点
        undefine_self//指节点的sub节点，但是未定义
        parent//指节点的父节点
        underfine_parent//指节点未定义的父节点,也就是说父节点和id所指节点之间存在新的节点
        multiple_candidate//指多个可能的父节点，需要进一步确认
     */
}//这个类型描述了一个节点和在树中的节点的关系
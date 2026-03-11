export interface abstruct_node{
    id:string,//id是一个node决定自身独一无二性的东西，一般直接是名字
    parent_node_id:string,
    parent_theory_id:string[]
}
//这也会存在dataBase\abstruct_tree\root下，文件格式是JSON
//是文件夹格式，名字即id.每个node占一个文件夹，然后同文件夹名.json存储节点的是本节点的内容，然后其有其子文件夹作为子节点
//而tree本身是通过一个数组来实现的，载入程序内存的部分

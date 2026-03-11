export interface theory{
    id:string,//一般是该理论的名字（20字以内），需要独一无二，如果有冲突可以修改，牵一发会动其覆盖的abstruct_node节点
    brief:string,//是该理论的简述，介绍的是该理论的描述对象，适用范围，以及该理论的作用。建议100字以内
    abstuct_node_id:string|null,//是该理论在abstruct_tree上的节点名，一般来说和id是一样的，如果该理论没有在abstruct_tree上，本值就是null
    text:string,//描述该理论的完整文本，需要保证sub_nodes_id都在里面，而且如果提到sub_nodes_id在被提到的时候以#{string}包裹
    sub_nodes_id:string[]//该理论所辖的abstruct节点们的id
}
//该文件负责暴露出各种文件操作函数
//通过文件操作来实现abstract_tree的管理
import { readIni } from "../../../utility/file_operation/read_ini"
import * as path from "path"
import * as fs from "fs"
import { abstruct_node } from "../data_structure/abstruct_tree_types"
export function get_base_abstructTree_file()
{
    return readIni(path.join(__dirname, '../../../../library_source.ini'), "abstract_tree_file")
}

function readNodeFromFolder(folderPath: string, nodeId: string): abstruct_node | null {
    const jsonPath = path.join(folderPath, `${nodeId}.json`)
    
    if (!fs.existsSync(jsonPath)) {
        return null
    }
    
    try {
        const content = fs.readFileSync(jsonPath, 'utf-8')
        const nodeData = JSON.parse(content)
        return nodeData as abstruct_node
    } catch (error) {
        console.error(`读取节点文件失败: ${jsonPath}`, error)
        return null
    }
}

function traverseFolder(folderPath: string, output: abstruct_node[]): void {
    if (!fs.existsSync(folderPath)) {
        return
    }
    
    const items = fs.readdirSync(folderPath)
    
    for (const item of items) {
        const itemPath = path.join(folderPath, item)
        const stat = fs.statSync(itemPath)
        
        if (stat.isDirectory()) {
            const nodeData = readNodeFromFolder(itemPath, item)
            if (nodeData) {
                output.push(nodeData)
            }
            traverseFolder(itemPath, output)
        }
    }
}

export function get_abstructTree_data():abstruct_node[]{
    let output:abstruct_node[] = [];
    try{
        let base_file = get_base_abstructTree_file()
        traverseFolder(base_file, output)
    }catch(error)
    {
        console.error("file_operator.ts中的function get_abstructTree_data()发生错误:")
        console.error(error);
    }
    return output;
}//把文件夹的数据载入为一个abstruct_node数组
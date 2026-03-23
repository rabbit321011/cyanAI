import * as fs from 'fs';
import * as path from 'path';
import { abstruct_node } from './src/component/abstract_tree/data_structure/abstruct_tree_types';

const ROOT_DIR = path.join(__dirname, 'dataBase', 'abstruct_tree', 'root');

interface NodeInfo {
    id: string;
    filePath: string;
    parentId: string;
}

function getAllNodes(dir: string, parentId: string = 'root'): NodeInfo[] {
    const results: NodeInfo[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            const jsonPath = path.join(fullPath, `${item}.json`);
            if (fs.existsSync(jsonPath)) {
                results.push({
                    id: item,
                    filePath: jsonPath,
                    parentId: parentId
                });
                results.push(...getAllNodes(fullPath, item));
            }
        }
    }

    return results;
}

function rebuildTree() {
    console.log('开始重建树结构...\n');

    const nodes = getAllNodes(ROOT_DIR);
    console.log(`找到 ${nodes.length} 个节点`);

    const nodeMap = new Map<string, NodeInfo>();
    for (const node of nodes) {
        nodeMap.set(node.id, node);
    }

    const rootChildren: string[] = [];

    for (const node of nodes) {
        const content = fs.readFileSync(node.filePath, 'utf-8');
        const data: abstruct_node = JSON.parse(content);

        data.id = node.id;
        data.parent_node_id = node.parentId;

        if (node.parentId === 'root') {
            rootChildren.push(node.id);
        }

        if (!data.subnodes_id) {
            data.subnodes_id = [];
        }

        const childIds = nodes
            .filter(n => n.parentId === node.id)
            .map(n => n.id);

        for (const childId of childIds) {
            if (!data.subnodes_id.includes(childId)) {
                data.subnodes_id.push(childId);
            }
        }

        fs.writeFileSync(node.filePath, JSON.stringify(data, null, 4), 'utf-8');
    }

    const rootJsonPath = path.join(ROOT_DIR, 'root.json');
    const rootContent = fs.readFileSync(rootJsonPath, 'utf-8');
    const rootData: abstruct_node = JSON.parse(rootContent);
    rootData.subnodes_id = rootChildren;
    fs.writeFileSync(rootJsonPath, JSON.stringify(rootData, null, 4), 'utf-8');

    console.log('\n树结构重建完成！');
    console.log(`根节点: ${rootChildren.join(', ')}`);
}

rebuildTree();
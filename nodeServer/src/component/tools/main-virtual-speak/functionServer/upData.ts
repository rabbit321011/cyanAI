import fs from 'fs'
export const execute = async (params: any,work_file:string) => {
    fs.writeFileSync(work_file,JSON.stringify(
        {
            result:params.file_path
        }
    ),'utf-8')
    return `文件路径已经成功上传`;
};
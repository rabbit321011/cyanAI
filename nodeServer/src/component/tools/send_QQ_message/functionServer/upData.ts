import fs from 'fs';

export const execute = async (params: any, work_file: string) => {
    fs.writeFileSync(work_file, JSON.stringify(
        {
            result: params.result
        }
    ), 'utf-8');
    return `数据已经成功上传`;
};

import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export async function uploadToCatbox(filePath: string, maxRetries: number = 3): Promise<string | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const fileStats = fs.statSync(filePath);
            if (fileStats.size > 200 * 1024 * 1024) {
                console.error('[Catbox] 文件过大，超过200MB限制');
                return null;
            }

            const fileStream = fs.createReadStream(filePath);
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', fileStream);

            console.log(`[Catbox] 上传尝试 ${attempt}/${maxRetries}...`);
            
            const response = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: {
                    ...form.getHeaders()
                },
                timeout: 60000
            });

            if (response.status === 200 && response.data && response.data.startsWith('https://')) {
                console.log(`[Catbox] 上传成功`);
                return response.data.trim();
            } else {
                console.error(`[Catbox] 上传失败 (尝试 ${attempt}):`, response.data);
            }
        } catch (error: any) {
            console.error(`[Catbox] 上传错误 (尝试 ${attempt}):`, error.message);
            if (attempt < maxRetries) {
                const waitTime = attempt * 2000;
                console.log(`[Catbox] 等待 ${waitTime}ms 后重试...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    return null;
}

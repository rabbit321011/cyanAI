import * as fs from 'fs';
import * as path from 'path';

// 支持的MIME类型映射
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

// 获取文件的MIME类型
function getMimeType(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  
  // 检查是否在已知映射中
  if (MIME_TYPES[ext]) {
    return MIME_TYPES[ext];
  }
  
  // 检查是否是其他image、video或audio类型
  if (ext.startsWith('.') && ext.length > 1) {
    const type = ext.substring(1);
    if (type.match(/^image\//)) {
      return `image/${type}`;
    } else if (type.match(/^video\//)) {
      return `video/${type}`;
    } else if (type.match(/^audio\//)) {
      return `audio/${type}`;
    }
  }
  
  return null;
}

// 将文件转换为base64
function fileToBase64(filePath: string): string | null {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    // 获取MIME类型
    const mimeType = getMimeType(filePath);
    if (!mimeType) {
      return null;
    }
    
    // 读取文件并转换为base64
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('文件转换失败:', error);
    return null;
  }
}

// 主函数：处理字符串中的@br%[path]@br格式
export function path_to_base64(input: string): string {
  // 正则表达式匹配@br%[path]@br格式
  const regex = /@br%\[(.*?)\]@br/g;
  
  return input.replace(regex, (match, filePath) => {
    // 尝试将文件路径转换为base64
    const base64Data = fileToBase64(filePath);
    
    if (base64Data) {
      // 转换成功，返回替换后的内容
      return `@br%[${base64Data}]@br`;
    } else {
      // 转换失败，返回原始内容
      return match;
    }
  });
}

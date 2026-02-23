import * as fs from 'fs';
import * as path from 'path';

function getCurrentTimestamp(): string {
  const now = new Date();
  const Y = now.getFullYear().toString().padStart(4, '0');
  const M = (now.getMonth() + 1).toString().padStart(2, '0');
  const D = now.getDate().toString().padStart(2, '0');
  const H = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const s = now.getSeconds().toString().padStart(2, '0');
  return `${Y}${M}${D}_${H}${m}${s}`;
}

const timestamp = getCurrentTimestamp();
const testFolderPath = path.join(__dirname, timestamp);

if (!fs.existsSync(testFolderPath)) {
  fs.mkdirSync(testFolderPath, { recursive: true });
  console.log(`创建测试文件夹: ${testFolderPath}`);
}

console.log(timestamp);

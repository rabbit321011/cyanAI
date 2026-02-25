import { readIni } from "../src/utility/file_operation/read_ini";
import { now } from "../src/utility/time/cyan_time";
import * as path from "path";
import * as fs from "fs";

console.log("=== 调试目录创建问题 ===\n");

const iniFilePath = path.join(__dirname, "../library_source.ini");
const eventFolder = readIni(iniFilePath, "event_folder");
const summaryFolder = readIni(iniFilePath, "event_summary_folder");

console.log("eventFolder:", eventFolder);
console.log("summaryFolder:", summaryFolder);

const currentTs = now();
console.log("\n当前时间戳:", currentTs);

const Y = currentTs.slice(0, 4);
const M = currentTs.slice(4, 6);
const D = currentTs.slice(6, 8);
const HhMmSs = currentTs.slice(9, 15);
const fileName = `${HhMmSs}.ent`;

console.log("\nY:", Y);
console.log("M:", M);
console.log("D:", D);
console.log("HhMmSs:", HhMmSs);
console.log("fileName:", fileName);

const relativeDir = path.join(Y, M, D);
const eventsDir = path.join(eventFolder, relativeDir);
const summaryDir = path.join(summaryFolder, relativeDir);

console.log("\nrelativeDir:", relativeDir);
console.log("eventsDir:", eventsDir);
console.log("summaryDir:", summaryDir);

console.log("\neventsDir 存在吗?", fs.existsSync(eventsDir));
console.log("summaryDir 存在吗?", fs.existsSync(summaryDir));

if (!fs.existsSync(eventsDir)) {
    console.log("\n正在创建 eventsDir...");
    try {
        fs.mkdirSync(eventsDir, { recursive: true });
        console.log("✅ eventsDir 创建成功！");
    } catch (error) {
        console.error("❌ eventsDir 创建失败:", error);
    }
} else {
    console.log("\neventsDir 已存在");
}

if (!fs.existsSync(summaryDir)) {
    console.log("\n正在创建 summaryDir...");
    try {
        fs.mkdirSync(summaryDir, { recursive: true });
        console.log("✅ summaryDir 创建成功！");
    } catch (error) {
        console.error("❌ summaryDir 创建失败:", error);
    }
} else {
    console.log("\nsummaryDir 已存在");
}

console.log("\n最终检查：");
console.log("eventsDir 存在吗?", fs.existsSync(eventsDir));
console.log("summaryDir 存在吗?", fs.existsSync(summaryDir));

import { appendEntry } from "../src/utility/ent_operation/ent_manager";
import { now } from "../src/utility/time/cyan_time";
import * as path from "path";
import { readIni } from "../src/utility/file_operation/read_ini";

console.log("=== 测试 appendEntry 函数 ===\n");

const iniFilePath = path.join(__dirname, "../library_source.ini");
const eventFolder = readIni(iniFilePath, "event_folder");

const currentTs = now();
const Y = currentTs.slice(0, 4);
const M = currentTs.slice(4, 6);
const D = currentTs.slice(6, 8);
const HhMmSs = currentTs.slice(9, 15);
const fileName = `${HhMmSs}.ent`;

const relativeDir = path.join(Y, M, D);
const eventsDir = path.join(eventFolder, relativeDir);
const eventsFilePath = path.join(eventsDir, fileName);

console.log("eventsFilePath:", eventsFilePath);
console.log("目录存在吗?", require("fs").existsSync(eventsDir));

const testEntry = {
    memory_state: {
        R: 1,
        S: 10,
        last_T_distance: "10day",
        D: 5,
        a: 1
    },
    current: "^测试用户:这是一个测试条目",
    extraCurrent: {},
    TIMESET: currentTs
};

console.log("\n准备调用 appendEntry...");
try {
    appendEntry(eventsFilePath, testEntry);
    console.log("✅ appendEntry 调用成功！");
} catch (error) {
    console.error("❌ appendEntry 调用失败:", error);
}

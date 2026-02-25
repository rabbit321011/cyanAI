//输入一个上下文数组（Message类型数组），和一个string作为事件的简介，一个number作为事件的Im，根据现在的时间自动将其保存在事件数据库里
//首先将其保存在events文件夹，但是events文件夹下的文件需要每个聊天记录都配一个memory_state，所以这里memory_state就默认为以下数值
/*
 R:1
 S:10
 last_T_distance : "10day"
 D:5
 a:1
 */
//因为Message类型是自带时间戳的，所以时间戳就用每个元素自带的就行
//然后current应该是`^${Message.role}:${Message.current}`
//extraCurrent是空对象
//接下来考虑event_summary文件夹，memory_state的内容都如下
/*
R:1
S:10
last_T_distance:"10day"
D:0
a:0//其实是因为没调参数所以设这么离谱的数值
 */
//event_summary里的那个文件代表的是这个上下文的整体的事件，其时间戳拿cyan_time.ts获取
//然后current和extraCurrent.Im都用输入
import { Message } from "../../types/process/process.type";
import { readIni } from "../../utility/file_operation/read_ini";
import { now } from "../../utility/time/cyan_time";
import { appendEntry } from "../../utility/ent_operation/ent_manager";
import * as path from "path";
import * as fs from "fs";

export function saveEvent(messages: Message[], summary: string, Im: number): string {
    try {
        const iniFilePath = path.join(__dirname, "../../../library_source.ini");
        const eventFolder = readIni(iniFilePath, "event_folder");
        const summaryFolder = readIni(iniFilePath, "event_summary_folder");

        const currentTs = now();
        const Y = currentTs.slice(0, 4);
        const M = currentTs.slice(4, 6);
        const D = currentTs.slice(6, 8);
        const HhMmSs = currentTs.slice(9, 15);
        const fileName = `${HhMmSs}.ent`;

        const relativeDir = path.join(Y, M, D);
        const eventsDir = path.join(eventFolder, relativeDir);
        const summaryDir = path.join(summaryFolder, relativeDir);

        fs.mkdirSync(eventsDir, { recursive: true });
        fs.mkdirSync(summaryDir, { recursive: true });

        const eventsFilePath = path.join(eventsDir, fileName);
        const summaryFilePath = path.join(summaryDir, fileName);

        for (const msg of messages) {
            const entry = {
                memory_state: {
                    R: 1,
                    S: 10,
                    last_T_distance: "10day",
                    D: 5,
                    a: 1
                },
                current: `^${msg.role}:${msg.current}`,
                extraCurrent: {},
                TIMESET: msg.time
            };
            appendEntry(eventsFilePath, entry);
        }

        const summaryEntry = {
            memory_state: {
                R: 1,
                S: 10,
                last_T_distance: "10day",
                D: 0,
                a: 0
            },
            current: summary,
            extraCurrent: { Im: Im },
            TIMESET: currentTs
        };
        appendEntry(summaryFilePath, summaryEntry);

        return `SUCCESS:事件已保存到 ${relativeDir}/${fileName}`;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return `ERROR:${err.message}`;
    }
}

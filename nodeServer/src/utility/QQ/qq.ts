import WebSocket from 'ws';
import { readIni } from '../file_operation/read_ini';
import { creat_source, input_for_uid } from '../../component/pipe/pipe';
import { inlineData, multimedia_message } from '../../types/process/process.type';
import { verifyQqKey, deductKeyQuota } from '../key_system/key_manager';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

interface FriendInfo {
    name: string;
    qq_num: string;
}

let main_qq_messages_uid = creat_source("main_qq_messages", "multi_contact_multimedia_message_array");

let apiWs: WebSocket | null = null;
let eventWs: WebSocket | null = null;
let isConnected: boolean = false;
let reconnectAttempts: number = 0;
const maxReconnectAttempts: number = 3;

let pendingRequests: Map<number, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map();
let requestId: number = 0;

function getWsPath(): string {
    return readIni(path.join(__dirname, '../../../library_source.ini'), 'QQ_wsPath');
}

export function getNapcatConnectionStatus(): { api: boolean; event: boolean; connected: boolean } {
    return {
        api: apiWs !== null && apiWs.readyState === WebSocket.OPEN,
        event: eventWs !== null && eventWs.readyState === WebSocket.OPEN,
        connected: isConnected
    };
}

function connectApi(): Promise<string> {
    return new Promise((resolve) => {
        const wsPath = getWsPath();
        apiWs = new WebSocket(`${wsPath}/api`);
        
        apiWs.on('open', () => {
            console.log('QQ API WebSocket 已连接');
            reconnectAttempts = 0;
            resolve('SUCCESS:API连接成功');
        });
        
        apiWs.on('message', (data: WebSocket.RawData) => {
            try {
                const response = JSON.parse(data.toString());
                if (response.echo !== undefined && pendingRequests.has(response.echo)) {
                    const pending = pendingRequests.get(response.echo);
                    pendingRequests.delete(response.echo);
                    if (pending) {
                        pending.resolve(response);
                    }
                }
            } catch (error) {
                console.error('解析API响应失败:', error);
            }
        });
        
        apiWs.on('error', (error: Error) => {
            console.error('QQ API WebSocket 错误:', error);
        });
        
        apiWs.on('close', () => {
            console.log('QQ API WebSocket 已断开');
            apiWs = null;
        });
    });
}

function connectEvent(): Promise<string> {
    return new Promise((resolve) => {
        const wsPath = getWsPath();
        eventWs = new WebSocket(`${wsPath}/event`);
        
        eventWs.on('open', () => {
            console.log('QQ Event WebSocket 已连接');
            reconnectAttempts = 0;
            resolve('SUCCESS:Event连接成功');
        });
        
        eventWs.on('message', (data: WebSocket.RawData) => {
            try {
                const event = JSON.parse(data.toString());
                handleEvent(event).catch((error) => {
                    console.error('处理事件失败:', error);
                });
            } catch (error) {
                console.error('解析事件失败:', error);
            }
        });
        
        eventWs.on('error', (error: Error) => {
            console.error('QQ Event WebSocket 错误:', error);
        });
        
        eventWs.on('close', () => {
            console.log('QQ Event WebSocket 已断开');
            eventWs = null;
        });
    });
}

const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024;

async function downloadToInline(url: string, defaultMimeType: string): Promise<{ mimeType: string; data: string } | null> {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            maxContentLength: MAX_DOWNLOAD_SIZE
        });

        const size = response.data.byteLength || response.data.length;
        if (size > MAX_DOWNLOAD_SIZE) {
            return null;
        }

        const base64 = Buffer.from(response.data).toString('base64');
        
        let mimeType = defaultMimeType;
        const magic = Buffer.from(response.data.slice(0, 8));
        
        if (magic[0] === 0x89 && magic[1] === 0x50) {
            mimeType = 'image/png';
        } else if (magic[0] === 0xFF && magic[1] === 0xD8) {
            mimeType = 'image/jpeg';
        } else if (magic[0] === 0x47 && magic[1] === 0x49) {
            mimeType = 'image/gif';
        } else if (magic[0] === 0x52 && magic[1] === 0x49) {
            mimeType = 'image/webp';
        } else if (magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70) {
            if (magic[0] === 0x00 || magic[0] === 0x20) {
                mimeType = 'audio/mp4';
            } else {
                mimeType = 'video/mp4';
            }
        } else if (magic[0] === 0x1A && magic[1] === 0x45 && magic[2] === 0xDF && magic[3] === 0xA3) {
            mimeType = 'video/webm';
        } else if (magic[0] === 0x23 && magic[1] === 0x21 && magic[2] === 0x41 && magic[3] === 0x4D) {
            mimeType = 'audio/amr';
        } else if (magic[0] === 0x4F && magic[1] === 0x67 && magic[2] === 0x67 && magic[3] === 0x53) {
            mimeType = 'audio/ogg';
        } else if (magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46) {
            mimeType = 'audio/wav';
        }

        return { mimeType, data: base64 };
    } catch (error) {
        console.error('下载文件失败:', error);
        return null;
    }
}

async function handleEvent(event: any): Promise<void> {
    if (event.post_type === 'message' && event.message_type === 'private') {
        const qq_num = String(event.user_id);
        const qq_name = event.sender?.nickname || qq_num;
        
        const parts: multimedia_message[] = [];
        
        if (event.message && Array.isArray(event.message)) {
            for (const seg of event.message) {
                if (seg.type === 'text') {
                    const text = seg.data?.text || '';
                    if (text) {
                        parts.push({
                            type: 'text',
                            content: text
                        });
                    }
                } else if (seg.type === 'image') {
                    const imageUrl = seg.data?.url;
                    if (imageUrl) {
                        try {
                            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                            
                            const maxSize = 5 * 1024 * 1024;
                            if (response.data.length > maxSize) {
                                console.error('图片太大:', response.data.length, 'bytes');
                                parts.push({
                                    type: 'text',
                                    content: '[图片太大，无法处理]'
                                });
                                continue;
                            }
                            
                            const base64 = Buffer.from(response.data, 'binary').toString('base64');
                            
                            let mimeType = 'image/jpeg';
                            const magic = Buffer.from(response.data.slice(0, 4));
                            if (magic[0] === 0x89 && magic[1] === 0x50) {
                                mimeType = 'image/png';
                            } else if (magic[0] === 0x47 && magic[1] === 0x49) {
                                mimeType = 'image/gif';
                            } else if (magic[0] === 0x52 && magic[1] === 0x49) {
                                mimeType = 'image/webp';
                            }
                            
                            parts.push({
                                type: 'image',
                                content: '[图片]',
                                inline: {
                                    mimeType: mimeType,
                                    data: base64
                                }
                            });
                        } catch (error) {
                            console.error('下载图片失败:', error);
                            parts.push({
                                type: 'text',
                                content: '[图片下载失败]'
                            });
                        }
                    }
                } else if (seg.type === 'record') {
                    const audioUrl = seg.data?.url;
                    if (audioUrl) {
                        const inlineData = await downloadToInline(audioUrl, 'audio/amr');
                        if (inlineData) {
                            parts.push({
                                type: 'audio',
                                content: '[语音]',
                                inline: inlineData
                            });
                        } else {
                            parts.push({
                                type: 'audio',
                                content: '[语音下载失败]',
                                file_url: ''
                            });
                        }
                    }
                } else if (seg.type === 'video') {
                    const videoUrl = seg.data?.url || seg.data?.file;
                    if (videoUrl) {
                        const inlineData = await downloadToInline(videoUrl, 'video/mp4');
                        if (inlineData) {
                            parts.push({
                                type: 'video',
                                content: '[视频]',
                                inline: inlineData
                            });
                        } else {
                            parts.push({
                                type: 'video',
                                content: '[视频下载失败或超过10MB]',
                                file_url: ''
                            });
                        }
                    }
                } else if (seg.type === 'file') {
                    const fileId = seg.data?.file_id;
                    const fileName = seg.data?.name || seg.data?.file || '[文件]';
                    
                    if (fileId) {
                        try {
                            const fileResponse = await sendApiRequest('get_file', {
                                file_id: fileId
                            });
                            
                            if (fileResponse.status === 'ok' && fileResponse.data?.url) {
                                const inlineData = await downloadToInline(fileResponse.data.url, 'application/octet-stream');
                                if (inlineData) {
                                    parts.push({
                                        type: 'file',
                                        content: fileName,
                                        inline: inlineData
                                    });
                                } else {
                                    parts.push({
                                        type: 'file',
                                        content: `[文件:${fileName} 下载失败或超过10MB]`,
                                        file_url: ''
                                    });
                                }
                            } else {
                                parts.push({
                                    type: 'file',
                                    content: `[文件:${fileName} 获取链接失败]`,
                                    file_url: ''
                                });
                            }
                        } catch (error) {
                            console.error('[file消息] get_file API 调用失败:', error);
                            parts.push({
                                type: 'file',
                                content: `[文件:${fileName} API调用失败]`,
                                file_url: ''
                            });
                        }
                    } else {
                        parts.push({
                            type: 'file',
                            content: `[文件:${fileName}]`,
                            file_url: ''
                        });
                    }
                }
            }
        }
        
        if (parts.length > 0) {
            await QQtrackTextExecute(qq_num, qq_name, parts);
        }
    }
}

async function sendApiRequest(action: string, params: any): Promise<any> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return { status: 'failed', retcode: -1, data: null };
    }
    
    return new Promise((resolve) => {
        const id = ++requestId;
        pendingRequests.set(id, { resolve, reject: resolve });
        
        const request = {
            action: action,
            params: params,
            echo: id
        };
        
        apiWs!.send(JSON.stringify(request));
        
        setTimeout(() => {
            if (pendingRequests.has(id)) {
                pendingRequests.delete(id);
                resolve({ status: 'failed', retcode: -2, data: null });
            }
        }, 10000);
    });
}

export async function QQsendMessage(qq_num: string, text: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: text
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:消息发送成功";
        } else {
            return `ERROR:消息发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送消息时发生错误:${error.message}`;
    }
}

export async function QQgetFriend(): Promise<FriendInfo[] | string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    try {
        const response = await sendApiRequest('get_friend_list', {});
        
        if (response.status === 'ok' && Array.isArray(response.data)) {
            const friends: FriendInfo[] = response.data.map((friend: any) => ({
                name: friend.nickname || friend.remark || '',
                qq_num: String(friend.user_id)
            }));
            return friends;
        } else {
            return `ERROR:获取好友列表失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:获取好友列表时发生错误:${error.message}`;
    }
}

export async function QQsendImg(qq_num: string, file_path: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    if (!fs.existsSync(file_path)) {
        return `ERROR:文件不存在:${file_path}`;
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'image', data: { file: `file:///${file_path.replace(/\\/g, '/')}` } }
            ]
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:图片发送成功";
        } else {
            return `ERROR:图片发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送图片时发生错误:${error.message}`;
    }
}

export async function QQsendAudio(qq_num: string, file_path: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }
    
    if (!fs.existsSync(file_path)) {
        return `ERROR:文件不存在:${file_path}`;
    }
    
    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'record', data: { file: `file:///${file_path.replace(/\\/g, '/')}` } }
            ]
        });
        
        if (response.status === 'ok') {
            return "SUCCESS:语音发送成功";
        } else {
            return `ERROR:语音发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送语音时发生错误:${error.message}`;
    }
}

export async function QQsendFileByUrl(qq_num: string, fileUrl: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }

    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'file', data: { file: fileUrl } }
            ]
        });

        if (response.status === 'ok') {
            return "SUCCESS:文件发送成功";
        } else {
            return `ERROR:文件发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送文件时发生错误:${error.message}`;
    }
}

export async function QQsendFile(qq_num: string, file_path: string): Promise<string> {
    if (!apiWs || apiWs.readyState !== WebSocket.OPEN) {
        return "ERROR:WebSocket未连接";
    }

    if (!fs.existsSync(file_path)) {
        return `ERROR:文件不存在:${file_path}`;
    }

    try {
        const response = await sendApiRequest('send_private_msg', {
            user_id: parseInt(qq_num),
            message: [
                { type: 'file', data: { file: `file:///${file_path.replace(/\\/g, '/')}` } }
            ]
        });

        if (response.status === 'ok') {
            return "SUCCESS:文件发送成功";
        } else {
            return `ERROR:文件发送失败,retcode=${response.retcode}`;
        }
    } catch (error: any) {
        return `ERROR:发送文件时发生错误:${error.message}`;
    }
}

export async function QQtrackRestart(): Promise<string> {
    reconnectAttempts = 0;
    
    const attemptReconnect = async (): Promise<string> => {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.log('QQ WebSocket 重连失败，已达最大重试次数');
            return "ERROR:重连失败，已达最大重试次数";
        }
        
        reconnectAttempts++;
        console.log(`QQ WebSocket 尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
        
        try {
            const apiResult = await connectApi();
            const eventResult = await connectEvent();
            
            if (apiResult.startsWith('SUCCESS') && eventResult.startsWith('SUCCESS')) {
                isConnected = true;
                return "SUCCESS:重启监听服务成功";
            } else {
                return await attemptReconnect();
            }
        } catch (error: any) {
            console.error('QQ WebSocket 重连错误:', error);
            return await attemptReconnect();
        }
    };
    
    return await attemptReconnect();
}

/**
 * 发送提示消息让用户绑定KEY
 */
async function sendKeyPrompt(qq_num: string): Promise<void> {
    const promptText = `你需要输入KEY来使用 cyanAI\n\n使用方法：\n1. 联系管理员获取KEY\n2. 发送 "^mulset bindkey 你的KEY" 绑定\n\n查询KEY信息发送 "^mulset checkkey"`;
    await QQsendMessage(qq_num, promptText);
}

export async function QQtrackTextExecute(qq_num: string, qq_name: string, parts: multimedia_message[]): Promise<string> {
    // KEY验证
    const verifyResult = verifyQqKey(qq_num);
    if (!verifyResult.valid) {
        await sendKeyPrompt(qq_num);
        return `SUCCESS:KEY验证失败，已发送提示 - ${verifyResult.error}`;
    }

    // 扣除KEY额度
    if (verifyResult.key) {
        const deductResult = deductKeyQuota(verifyResult.key.key);
        if (!deductResult.success) {
            await QQsendMessage(qq_num, `KEY额度扣除失败: ${deductResult.error}`);
            return `SUCCESS:KEY额度扣除失败 - ${deductResult.error}`;
        }
    }
    
    // 通过 pipe 发送消息（单元素数组）
    input_for_uid(main_qq_messages_uid, {
        messages: [{
            id: qq_num,
            name: qq_name,
            parts: parts
        }]
    }, "multi_contact_multimedia_message_array");
    
    return "SUCCESS:消息已发送到pipe";
}

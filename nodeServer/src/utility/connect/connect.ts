import { readIni } from '../file_operation/read_ini';
import { getNapcatConnectionStatus } from '../QQ/qq';
import path from 'path';

export interface ConnectResult {
    success: boolean;
    message: string;
    details?: any;
}

export async function checkPyServer(): Promise<ConnectResult> {
    const pyServerUrl = readIni(path.join(__dirname, '../../../library_source.ini'), 'local_api_url');
    
    try {
        const response = await fetch(`${pyServerUrl}/ping`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                message: 'pyServer连接正常',
                details: {
                    url: pyServerUrl,
                    response: data
                }
            };
        } else {
            return {
                success: false,
                message: `pyServer响应异常，状态码: ${response.status}`,
                details: { url: pyServerUrl }
            };
        }
    } catch (error: any) {
        return {
            success: false,
            message: `pyServer连接失败: ${error.message}`,
            details: { url: pyServerUrl }
        };
    }
}

export function checkNapcat(): ConnectResult {
    const status = getNapcatConnectionStatus();
    return {
        success: status.connected,
        message: status.connected ? 'Napcat已连接' : 'Napcat未连接',
        details: {
            api: status.api ? '已连接' : '未连接',
            event: status.event ? '已连接' : '未连接'
        }
    };
}

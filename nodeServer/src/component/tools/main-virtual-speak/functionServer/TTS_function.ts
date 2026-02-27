import axios from 'axios';

export const execute = async (params: any, work_file: string) => {
    const { input, instruct, language, temperature, top_p } = params;
    
    try {
        const response = await axios.post('http://localhost:3723/tts/generate', {
            text: input,
            instruct: instruct,
            language: language || 'Chinese',
            temperature: temperature ?? 0.65,
            top_p: top_p ?? 0.92
        });
        
        if (response.data.status === 'success') {
            return {
                status: 'success',
                message: response.data.message,
                generated_audio_path: response.data.generated_audio_path
            };
        } else {
            throw new Error(response.data.message || 'TTS生成失败');
        }
    } catch (error) {
        console.error('TTS API调用失败:', error);
        throw new Error('TTS API调用失败');
    }
};
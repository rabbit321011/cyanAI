import axios from 'axios';
import { readIni } from '../../src/utility/file_operation/read_ini';
import path from 'path';

async function testApi2() {
    const apiKey = readIni(path.join(__dirname, '../../library_source.ini'), 'google_api_key_2');
    const baseUrl = readIni(path.join(__dirname, '../../library_source.ini'), 'google_base_url_2');
    
    console.log('Testing API 2:');
    console.log('Base URL:', baseUrl);
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    
    const cleanBaseUrl = baseUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
    const url = `${cleanBaseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
        contents: [{
            role: 'user',
            parts: [{ text: 'Hello, are you working?' }]
        }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
        ]
    };
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    
    try {
        console.log('Sending request...');
        const response = await axios.post(url, payload, { headers, timeout: 30000 });
        console.log('✅ API 2 is working!');
        console.log('Response:', response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No text');
        return true;
    } catch (error: any) {
        console.error('❌ API 2 failed:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data || error.message);
        return false;
    }
}

testApi2();

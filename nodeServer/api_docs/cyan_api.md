# CyanAI API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/cyan`

---

## 接口列表

### 1. 检测状态

检测 `main_virtual` 状态是否存在

**接口**: `GET /exit`

**请求示例**:
```http
GET http://localhost:3000/api/cyan/exit
```

**响应示例**:
```json
{
  "result": true
}
```

**响应字段**:
- `result` (boolean): `true` 表示状态存在，`false` 表示状态不存在

---

### 2. 发送消息

发送用户消息并获取模型回复

**接口**: `POST /send`

**请求示例**:
```http
POST http://localhost:3000/api/cyan/send
Content-Type: application/json

{
  "current": "你好！我是测试用户。",
  "user_name": "TestUser"
}
```

**请求字段**:
- `current` (string, 必需): 用户发送的消息内容
- `user_name` (string, 必需): 用户名称

**响应示例**:
```json
{
  "result": "你好呀！我是晴蓝，请多关照呢。"
}
```

**响应字段**:
- `result` (string): 模型的回复内容，或错误信息

---

## 错误处理

如果发生错误，`result` 字段会返回以下格式的错误信息：

```json
{
  "result": "ERROR:xxx错误信息"
}
```

常见错误：
- `ERROR:获取内核状态错误` - 读取或创建状态文件失败
- `ERROR:发送信息时错误:xxx` - 发送消息时发生错误，包含详细错误信息
- `ERROR:历史记录的最后一条获取失败` - 获取模型回复失败

---

## 使用示例 (JavaScript)

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api/cyan';

// 1. 检测状态
async function checkStatus() {
  const response = await axios.get(`${BASE_URL}/exit`);
  console.log('状态:', response.data.result);
}

// 2. 发送消息
async function sendMessage(message, userName) {
  const response = await axios.post(`${BASE_URL}/send`, {
    current: message,
    user_name: userName
  });
  console.log('模型回复:', response.data.result);
  return response.data.result;
}

// 连续对话示例
async function conversation() {
  await sendMessage('你好！我是测试用户。', 'TestUser');
  await sendMessage('你还记得我是谁吗？', 'TestUser');
  await sendMessage('很高兴认识你！', 'TestUser');
}
```

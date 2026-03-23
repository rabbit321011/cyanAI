# CyanAI API 快速调用指南

## 前置条件
- 服务已启动：`python run.py`
- 服务地址：`http://localhost:3723`

---

## 1. 检查服务是否运行

```bash
curl http://localhost:3723/ping
```

响应：
```json
{
  "status": "ok",
  "message": "Python server is alive!"
}
```

---

## 2. RAG 接口

### 2.1 文本向量化

**请求**：
```bash
curl -X POST http://localhost:3723/rag/embed \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"你要向量化的文本\"}"
```

**响应**：
```json
{
  "status": "success",
  "vector_str": "[0.012, -0.034, 0.056, ...]"
}
```

---

### 2.2 插入数据

**请求**：
```bash
curl -X POST http://localhost:3723/rag/insert \
  -H "Content-Type: application/json" \
  -d "{
    \"table_name\": \"event\",
    \"vector_str\": \"[0.012, -0.034, 0.056]\",
    \"data_str\": \"{\\\"title\\\": \\\"标题\\\", \\\"content\\\": \\\"内容\\\"}\"
  }"
```

**table_name可选值**：`event`、`theory`、`object`、`relationship`、`temp`、`chat`

**响应**：
```json
{
  "status": "success",
  "message": "Data inserted successfully."
}
```

---

### 2.3 Top-K 搜索

**请求**：
```bash
curl -X POST http://localhost:3723/rag/search/topk \
  -H "Content-Type: application/json" \
  -d "{
    \"target_dbs\": [\"event\", \"theory\"],
    \"vector_str\": \"[0.012, -0.034, 0.056]\",
    \"k\": 5
  }"
```

**target_dbs可选值**：`["event"]`、`["theory"]`、`["object"]`、`["relationship"]`、`["temp"]`、`["chat"]`，或多个组合

**响应**：
```json
{
  "status": "success",
  "results": [
    "{\"title\": \"结果1\", \"content\": \"...\"}",
    "{\"title\": \"结果2\", \"content\": \"...\"}"
  ]
}
```

---

### 2.4 阈值搜索

**请求**：
```bash
curl -X POST http://localhost:3723/rag/search/threshold \
  -H "Content-Type: application/json" \
  -d "{
    \"target_dbs\": [\"event\", \"theory\"],
    \"vector_str\": \"[0.012, -0.034, 0.056]\",
    \"threshold\": 0.8
  }"
```

**threshold范围**：0-1之间，值越大越严格

**响应**：
```json
{
  "status": "success",
  "results": [
    "{\"title\": \"高相似度结果\", \"content\": \"...\"}"
  ]
}
```

---

### 2.5 删除数据

**请求**：
```bash
curl -X POST http://localhost:3723/rag/delete \
  -H "Content-Type: application/json" \
  -d "{
    \"table_name\": \"event\",
    \"data_str\": \"{\\\"title\\\": \\\"标题\\\", \\\"content\\\": \\\"内容\\\"}\"
  }"
```

**注意**：`data_str`必须与插入时完全一致

**响应**：
```json
{
  "status": "success",
  "message": "Deleted successfully."
}
```

---

### 2.6 重排序

**请求**：
```bash
curl -X POST http://localhost:3723/rag/rerank \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"你的查询\",
    \"targets\": [
      \"文本1\",
      \"文本2\",
      \"文本3\"
    ]
  }"
```

**响应**：
```json
{
  "status": "success",
  "scores": [0.9998, 0.0001, 0.0474]
}
```

**scores说明**：0-1之间，越高表示越相关

---

### 2.7 清空单个表

**请求**：
```bash
curl -X POST http://localhost:3723/rag/clear/table \
  -H "Content-Type: application/json" \
  -d "{\"table_name\": \"temp\"}"
```

**响应**：
```json
{
  "status": "success",
  "message": "Table 'temp' cleared successfully."
}
```

---

### 2.8 清空所有表

**请求**：
```bash
curl -X POST http://localhost:3723/rag/clear/all
```

**响应**：
```json
{
  "status": "success",
  "message": "All tables cleared successfully."
}
```

---

## 3. TTS 接口

### 文本转语音（Custom Voice）

**请求**：
```bash
curl -X POST http://localhost:3723/tts/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"你要说的话\",
    \"instruct\": \"用自然亲切的语气说\",
    \"language\": \"Chinese\",
    \"temperature\": 0.65,
    \"top_p\": 0.92
  }"
```

**参数说明**：
- `text`：要合成的文本（必填）
- `instruct`：语气和表达方式的描述（可选，支持中文长描述）
- `language`：合成语音的语言（可选，默认为"Chinese"）
  - 支持的值："auto"、"chinese"、"english"、"japanese"、"korean"、"german"、"french"、"russian"、"portuguese"、"spanish"、"italian"
- `temperature`：控制生成的随机性（可选，默认为0.65）
  - 范围：0.0-2.0（推荐0.5-1.0）
  - 值越低越稳定，值越高越多样
- `top_p`：核采样参数（可选，默认为0.92）
  - 范围：0.0-1.0（推荐0.8-0.95）
  - 只保留累积概率达到该值的token

**响应**：
```json
{
  "status": "success",
  "message": "Audio generated successfully.",
  "generated_audio_path": "e:\\AIlibs\\audio\\20260227_193319.wav"
}
```

---

## 4. Python 示例代码

### 完整 RAG 流程示例

```python
import requests
import json

BASE_URL = "http://localhost:3723"

# 1. 向量化查询文本
query = "你要搜索的内容"
resp = requests.post(f"{BASE_URL}/rag/embed", json={"text": query})
vector_str = resp.json()["vector_str"]

# 2. 搜索
resp = requests.post(
    f"{BASE_URL}/rag/search/topk",
    json={
        "target_dbs": ["event", "theory", "object", "relationship", "temp", "chat"],
        "vector_str": vector_str,
        "k": 5
    }
)
results = resp.json()["results"]

# 3. 解析结果
for res in results:
    data = json.loads(res)
    print(f"标题: {data['title']}")
    print(f"内容: {data['content']}")
    print("---")
```

### TTS 生成示例

```python
import requests

BASE_URL = "http://localhost:3723"

# 生成语音
resp = requests.post(
    f"{BASE_URL}/tts/generate",
    json={
        "text": "你好，我是yoeawa！",
        "instruct": "用自然亲切的语气说",
        "language": "Chinese",
        "temperature": 0.65,
        "top_p": 0.92
    }
)

result = resp.json()
if result["status"] == "success":
    print(f"音频已生成: {result['generated_audio_path']}")
else:
    print(f"生成失败: {result['message']}")
```

---

## 快速参考

| 接口 | 方法 | URL |
|------|------|-----|
| 服务检查 | GET | `/ping` |
| 系统信息 | GET | `/health` |
| 文本向量化 | POST | `/rag/embed` |
| 插入数据 | POST | `/rag/insert` |
| Top-K搜索 | POST | `/rag/search/topk` |
| 阈值搜索 | POST | `/rag/search/threshold` |
| 删除数据 | POST | `/rag/delete` |
| 重排序 | POST | `/rag/rerank` |
| 清空单个表 | POST | `/rag/clear/table` |
| 清空所有表 | POST | `/rag/clear/all` |
| TTS生成 | POST | `/tts/generate` |
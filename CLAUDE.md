# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

cyanAI is an AI Agent system designed for persistent use with virtual context management and event memory storage. It features virtual context (main-virtual), an abstract knowledge tree, tool execution system, event storage/retrieval, and QQ integration via WebSocket (OneBot protocol).

## Commands

```bash
# Backend (Express + TypeScript) - runs on port 3000
cd nodeServer && pnpm dev

# Frontend (Vue 3 + TypeScript + Vite) - runs on port 5173
cd VUE && pnpm dev

# Build frontend for production
cd VUE && pnpm build
```

## Architecture

### Backend (nodeServer)

```
nodeServer/
├── src/
│   ├── app.ts                    # Express app entry, routes /api/agent and /api/cyan
│   ├── component/
│   │   ├── process/
│   │   │   ├── main_virtual.ts   # Core virtual context management (main-virtual process)
│   │   │   └── tool_process.ts   # Tool execution engine
│   │   ├── abstract_tree/        # Knowledge tree structure (JSON file-based)
│   │   ├── events/               # Event loading/saving (chat history)
│   │   ├── tools/                # Tools: TTS, QQ message, examples
│   │   └── escaper/              # Text processing (timestamp removal, path encoding)
│   ├── controllers/              # Express route handlers
│   ├── services/                 # Business logic
│   ├── routes/                   # Route definitions
│   ├── types/                    # TypeScript type definitions
│   └── utility/
│       ├── LLM_call/             # DeepSeek & Google Gemini API calls
│       ├── QQ/                   # QQ WebSocket connection (OneBot)
│       ├── file_operation/       # INI config reading/writing
│       └── error_type/           # Error handling, API key management
├── core_datas/                   # Prompts, examples, system data
├── dataBase/                     # Persistent storage (events, abstract tree)
└── library_source.ini            # API keys, QQ WebSocket path config
```

### Frontend (VUE)

Vue 3 + TypeScript + Naive UI component library. Uses Marked + KaTeX for Markdown rendering.

## Key Concepts

- **Virtual Context (main-virtual)**: Main agent process that maintains conversation context using an event-based memory system with memory strength decay (S-value, R-value)
- **Abstract Tree**: JSON file-based knowledge tree stored in `dataBase/abstruct_tree/`
- **Tools**: Executable functions the agent can call (TTS, QQ messages, file operations)
- **Events**: Chat sessions stored with timestamps, retrievable via RAG

## Configuration

Edit `nodeServer/library_source.ini` to configure:
- `[LLM]` section: API keys for DeepSeek and Google Gemini
- `[QQ]` section: WebSocket path (e.g., `ws://127.0.0.1:4286`)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cyan/exit` | GET | Health check |
| `/api/cyan/send` | POST | Send message, get AI response |
| `/api/cyan/closeEvent` | POST | End current chat event |

## Design Documents

See `main.md` for detailed architecture design including:
- Virtual context structure and memory decay algorithm (S = S * (1 + a * e^(-D) * (1 - R)))
- Flow packets (nl_packet: aim, scene, appendix, output limits)
- Tool categories (process-tools, natural-tools, AI tools, device tools)
- Observer/monitor system design

## Important Notes

- Backend uses CommonJS (`"type": "commonjs"`), frontend uses ES modules
- TypeScript config files deleted - uses ts-node directly via nodemon
- QQ integration via WebSocket requires separate OneBot server running
- Abstract tree storage uses folder-per-node structure with JSON files
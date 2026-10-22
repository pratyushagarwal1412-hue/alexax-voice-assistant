# AlexaX — Your Personal AI Agent 🎙️⚡

> Inspired by the **Alexa+ Challenge**: An intelligent, conversational AI assistant that understands user requests, maintains multi-turn conversation context, speaks and listens via the browser Web Speech API, and executes real actions through an official **Model Context Protocol (MCP)** server.

[![MCP Protocol](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-8b5cf6.svg)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v22+-339933.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/Storage-SQLite-003B57.svg)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)

---

## 🌟 Key Features

### 1. Conversational AI & Context Memory
- **Multi-Turn Context Retention**: Keeps conversation history and remembers context across turns.
- **Multi-Provider LLM Integration**: Supports **Google Gemini**, **OpenAI**, or our built-in **Smart Fallback Engine** (works 100% offline with zero API keys required).
- **Tool-Execution Loop**: The AI agent autonomously decides which MCP tools to invoke, executes them, inspects results, and speaks back natural answers.

### 2. Voice Interaction
- **Speech-to-Text (STT)**: Microphone button powered by browser Web Speech Recognition (`webkitSpeechRecognition` / `SpeechRecognition`) with real-time transcript streaming.
- **Text-to-Speech (TTS)**: High-fidelity speech synthesis with auto-speak response, voice selection, pitch/rate controls, and mute toggle.
- **Pulsing Alexa+ Glowing Visualizer**: Ambient glowing orb with dynamic waveform animations reflecting listening and speaking states.
- **Text Fallback**: Full fallback keyboard input for browsers without microphone permissions.

### 3. Self-Hosted MCP Server (`@modelcontextprotocol/sdk`)
Self-hosted server implementing the official Model Context Protocol TypeScript SDK:
1. `get_current_time`: Get formatted time, date, weekday, and ISO timestamp for any IANA timezone (e.g. `Asia/Tokyo`, `Europe/London`, `UTC`).
2. `calculate`: Safe math evaluator supporting standard operators, percentages (e.g. `15% tip on $85.50`), square roots, and functions.
3. `create_note`: Persist structured notes with title, body content, and categorized tags.
4. `search_notes`: Search notes by keyword in title/body or filter by tag.
5. `get_weather`: Live real-time worldwide weather via Open-Meteo Geocoding and Forecast API (no API key needed!), with labeled simulated fallback.
6. `manage_tasks`: Create, list (all/pending/completed), mark complete, and delete tasks with priority (`low`, `medium`, `high`) and due dates.
- **Official SSE Transport**: Exposes `/mcp/sse` and `/mcp/messages` for external MCP clients (e.g., Claude Desktop, MCP Inspector).
- **Interactive MCP Explorer**: Built-in visual playground to inspect schemas and execute MCP tools live with JSON parameter inputs and latency tracking.

### 4. Task & Memory Management
- **Persistent SQLite Storage**: Stored locally in `server/data/alexax.db` (WAL mode enabled for speed and safety).
- **Separation of Concerns**: Conversation memory is cleanly decoupled from task and note storage.
- **Destructive Action Confirmation**: Confirmation modals prevent accidental deletion of tasks, notes, or conversation histories.
- **Instant Seeding**: Pre-loaded sample tasks, notes, and welcome prompt on initial launch.

### 5. Polished UI & Alexa+ Aesthetics
- Premium dark theme (`#070913`, `#0c0f20`) with glowing purple-blue-cyan gradients.
- Responsive sidebar navigation: AI Chat, Tasks, Notes, and MCP Tools Explorer.
- Expandable tool execution badges showing exact inputs and outputs.
- Confetti celebration animation upon completing tasks!

---

## 🏗️ Architecture

```
alexax-voice-assistant/
├── server/                          # Backend Server & MCP Host
│   ├── src/
│   │   ├── index.ts                 # Express Server + MCP SSE Transport + Static Host
│   │   ├── config.ts                # Environment and path configurations
│   │   ├── db/                      # SQLite Persistence Layer
│   │   │   ├── index.ts             # SQLite initialization & schema
│   │   │   ├── taskRepo.ts          # Task CRUD & search operations
│   │   │   ├── noteRepo.ts          # Note CRUD & search operations
│   │   │   ├── chatRepo.ts          # Conversation sessions & message memory
│   │   │   └── seed.ts              # Initial demo data seeder
│   │   ├── mcp/                     # Official Model Context Protocol Layer
│   │   │   ├── server.ts            # Self-hosted MCP Server & SSE transport
│   │   │   ├── registry.ts          # Central tool registry & schemas
│   │   │   └── tools/               # 6 MCP Tools implementations
│   │   ├── agent/                   # Conversational AI Orchestrator
│   │   │   ├── orchestrator.ts      # Multi-turn context & tool execution loop
│   │   │   └── providers/           # Gemini, OpenAI, and Mock Fallback
│   │   ├── routes/                  # Express REST API Routes
│   │   └── tests/                   # Automated unit & integration tests
├── client/                          # React + TypeScript + Tailwind CSS Frontend
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.ts               # Backend API client
│   │   │   └── speech.ts            # Web Speech API (STT & TTS)
│   │   ├── components/
│   │   │   ├── chat/                # ChatView, ToolCallBadge, VoiceInputBar
│   │   │   ├── tasks/               # TaskView, TaskCard, TaskModal
│   │   │   ├── notes/               # NoteView, NoteCard, NoteModal
│   │   │   ├── mcp/                 # McpExplorerView (Interactive Runner)
│   │   │   ├── layout/              # Header, Sidebar, VoiceVisualizer
│   │   │   ├── common/              # ConfirmModal, Badges
│   │   │   └── settings/            # SettingsModal
├── .env.example                     # Environment template
└── package.json                     # Monorepo root scripts
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- **Node.js**: v20+ or v22+ (tested and verified on Node.js v24.19.0)
- **npm**: v10+

### 1. Clone & Install Dependencies
From the project root:
```bash
# Install root, server, and client dependencies
npm run setup
```
*(Alternatively, run `npm install` inside `server` and `client` individually)*

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `server/.env`:
```bash
cp .env.example server/.env
```
Default configuration works **out of the box** with the intelligent Demo Engine:
```env
PORT=3001
HOST=0.0.0.0
LLM_PROVIDER=mock
GEMINI_API_KEY=
OPENAI_API_KEY=
DATA_DIR=./data
```
> **Note**: To use Google Gemini or OpenAI, simply supply your `GEMINI_API_KEY` or `OPENAI_API_KEY` in `server/.env` or in the in-app **Settings** modal.

### 3. Build & Run Production Mode (Recommended)
Build both client and server, then run the unified application on port 3001:
```bash
# Build client and server
npm run build

# Start the application
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser!

### 4. Run Development Mode
To run with live hot-reloading:
```bash
# Terminal 1: Backend & MCP Server
npm run dev:server

# Terminal 2: Frontend Vite Dev Server
npm run dev:client
```
Frontend runs on **[http://localhost:5173](http://localhost:5173)** and automatically proxies `/api` and `/mcp` requests to the backend on `localhost:3001`.

---

## 🧪 Automated Testing

AlexaX comes with automated unit and integration tests covering all 6 MCP tools, tool schemas, and conversation context retention:

```bash
npm test
```

### Verified Test Suite
- `MCP Tools Registry exposes all 6 required tools with valid schemas`
- `Tool: get_current_time returns valid time and timezone`
- `Tool: calculate handles arithmetic and percentages`
- `Tool: create_note and search_notes persist and find data`
- `Tool: get_weather returns structured weather data`
- `Tool: manage_tasks supports create, list, complete, delete lifecycle`
- `executeToolDirect dispatches to tools registry cleanly`
- `Chat Orchestrator: handles multi-turn conversation and maintains context`
- `Chat Orchestrator: executes task creation via natural language`
- `Chat Orchestrator: executes note creation via natural language`

---

## 🔌 Connecting via Model Context Protocol (MCP)

AlexaX implements the official MCP TypeScript SDK over Server-Sent Events (SSE).

### Connecting with Claude Desktop
Add AlexaX to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "alexax": {
      "url": "http://localhost:3001/mcp/sse"
    }
  }
}
```

### Testing with MCP Inspector
Run the official `@modelcontextprotocol/inspector`:
```bash
npx @modelcontextprotocol/inspector http://localhost:3001/mcp/sse
```

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check and server status |
| `/api/chat` | `POST` | Send message, orchestrate AI agent & execute MCP tools |
| `/api/conversations` | `GET` | Retrieve conversation sessions |
| `/api/conversations` | `POST` | Create a new conversation session |
| `/api/conversations/:id` | `GET` | Get full message history of conversation |
| `/api/conversations/:id` | `DELETE` | Delete a conversation session |
| `/api/tasks` | `GET` | List tasks (supports `?filter=pending\|completed` & `?query=...`) |
| `/api/tasks` | `POST` | Create a new task |
| `/api/tasks/:id/toggle` | `PATCH` | Toggle task completion |
| `/api/tasks/:id` | `PUT` | Update task details |
| `/api/tasks/:id` | `DELETE` | Delete a task |
| `/api/notes` | `GET` | List notes (supports `?query=...` & `?tag=...`) |
| `/api/notes` | `POST` | Create a new note |
| `/api/notes/:id` | `PUT` | Update note |
| `/api/notes/:id` | `DELETE` | Delete note |
| `/api/mcp/tools` | `GET` | List all 6 MCP tools with JSON schemas |
| `/api/mcp/execute` | `POST` | Execute any MCP tool directly with parameters |
| `/api/mcp/status` | `GET` | View live MCP server status & active SSE sessions |
| `/mcp/sse` | `GET` | Official MCP SSE transport stream |
| `/mcp/messages` | `POST` | Official MCP message handler for active sessions |

---

## 🚢 Deployment Guide

### Deploying with Docker
A simple single-container deployment:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm run setup && npm run build
EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0
CMD ["npm", "start"]
```

### Deploying to Render / Railway / Cloud Run
1. Set the root build command to: `npm run setup && npm run build`
2. Set the start command to: `npm start`
3. Expose port `3001`
4. Add environment variables: `LLM_PROVIDER`, `GEMINI_API_KEY` (optional), `OPENAI_API_KEY` (optional).

---

## 🏆 Summary

AlexaX brings the vision of **Alexa+** to life:
- **Intelligent Voice Assistant**: Speak or type seamlessly with real-time audio visual feedback.
- **Model Context Protocol (MCP)**: Self-hosted server utilizing `@modelcontextprotocol/sdk` with 6 production-ready tools.
- **Contextual Memory & Storage**: Persistent SQLite backing for multi-turn sessions, tasks, and notes.
- **Zero-Setup Demo Mode**: Completely runnable out-of-the-box without requiring third-party API keys or external accounts!

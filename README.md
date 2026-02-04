# hurAI - AI-Augmented Helpdesk System

<p align="center">
  <strong>🤖 Intelligent helpdesk platform with AI-powered self-service and multi-channel support</strong>
</p>

---

## 📋 Overview

**hurAI** is an AI-augmented helpdesk system that streamlines support operations through intelligent automation, multi-channel integration, and knowledge reuse. It reduces redundancy, lowers skill barriers for agents, and provides self-service resolution for end-users.

### Core Features

- 🧠 **AI-Powered Routing** - Automatic query classification and intelligent routing
- 🔒 **PII Protection** - Automatic anonymization before LLM processing
- 📚 **Knowledge Base** - Vector-based semantic search with Pinecone
- 🎫 **Ticket Management** - Full lifecycle with escalation support
- 👥 **Role-Based Access** - Admin, Agent, and End-User roles
- 🤖 **Multi-LLM Support** - Gemini and OpenAI providers with fallback

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Login   │  │  Admin   │  │  Agent   │  │  Ticket Views    │ │
│  │  Page    │  │Dashboard │  │Dashboard │  │  & Management    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST API
┌─────────────────────────▼───────────────────────────────────────┐
│                     SERVER (Express.js)                         │
│                                                                 │
│  ┌─────────────────── API Routes ──────────────────────────┐   │
│  │  /api/router  │  /api/tickets  │  /api/kb  │  /api/demo │   │
│  └───────────────┴────────────────┴───────────┴────────────┘   │
│                                                                 │
│  ┌─────────────────── Core Services ───────────────────────┐   │
│  │                                                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │ Router   │  │Classifier│  │    KB    │  │   PII   │  │   │
│  │  │ Service  │  │ Service  │  │ Service  │  │ Service │  │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘  │   │
│  │       │             │             │             │        │   │
│  │       └─────────────┴──────┬──────┴─────────────┘        │   │
│  │                            │                              │   │
│  │                    ┌───────▼───────┐                     │   │
│  │                    │  LLM Service  │                     │   │
│  │                    │ (Gemini/OpenAI)│                    │   │
│  │                    └───────────────┘                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Firebase   │  │   Pinecone   │  │  LLM APIs    │
│  (Auth + DB) │  │  (Vectors)   │  │(Gemini/OpenAI)│
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔄 Query Routing Workflow

```
User Query
     │
     ▼
┌──────────────────┐
│ Check Escalation │ ──► "talk to agent" ──► Route to Human Agent
│    Keywords      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  PII Anonymizer  │ ──► Removes names, emails, phones, SSN, etc.
│                  │     Creates token mapping for restoration
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Classifier     │ ──► Determines: complexity (1-10), category
│   (LLM-based)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   KB Search      │ ──► Vector similarity search in Pinecone
│   (Semantic)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Make Decision   │
│                  │
│  Simple (≤5) +   │──► Self-Service: LLM direct response
│  any KB match    │
│                  │
│  Complex (>5) +  │──► Self-Service: LLM + KB knowledge
│  good KB match   │
│                  │
│  Complex (>5) +  │──► Escalate to Human Agent
│  no KB match     │
└──────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ 
- **npm** or **yarn**
- **Firebase Account** - For authentication and Firestore
- **Pinecone Account** - For vector database
- **Google AI (Gemini)** or **OpenAI** API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saketh190/hurAI.git
   cd hurAI
   git checkout woxsen
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

1. **Server Environment Variables** - Create `server/.env`:
   ```env
   # Server
   PORT=3001

   # LLM Provider (choose one or both for fallback)
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key

   # Pinecone (Vector Database)
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX=hurai-kb

   # Firebase Admin SDK (download from Firebase Console)
   # Place serviceAccountKey.json in server/ folder
   ```

2. **Firebase Service Account**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `server/serviceAccountKey.json`
   
   > ⚠️ **NEVER commit this file to git!**

3. **Client Firebase Config** - Already configured in `client/src/firebase.js`

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   Server runs on `http://localhost:3001`

2. **Start the frontend client** (new terminal)
   ```bash
   cd client
   npm run dev
   ```
   Client runs on `http://localhost:5173`

3. **Create an admin user** (first-time setup)
   ```bash
   cd server
   node scripts/create-admin.js
   ```

---

## 📡 API Endpoints

### Router (Self-Service)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/router/query` | Route user query (self-service or escalate) |
| GET | `/api/router/config` | Get router configuration |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets` | Create new ticket |
| GET | `/api/tickets` | List open tickets |
| GET | `/api/tickets/:id` | Get ticket details |
| POST | `/api/tickets/:id/message` | Add message to ticket |
| POST | `/api/tickets/:id/escalate` | Escalate ticket |
| POST | `/api/tickets/:id/assign` | Assign to agent |
| POST | `/api/tickets/:id/resolve` | Resolve ticket |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kb/index` | Index KB files |
| POST | `/api/kb/search` | Search KB (semantic) |
| GET | `/api/kb/chunks` | List indexed chunks |
| POST | `/api/kb/draft` | Generate response draft |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents` | Register new agent |
| GET | `/api/agents` | List all agents |

### Demo/Testing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/demo/classify` | Test classifier |
| POST | `/api/demo/llm` | Test LLM |
| POST | `/api/demo/pii` | Test PII anonymization |
| POST | `/api/demo/full-flow` | Test complete flow |
| GET | `/api/demo/health` | Health check |

---

## 🔒 Security Features

### PII Anonymization
Before any text is sent to an LLM, the PII service:
1. Detects personal information (names, emails, phone numbers, SSNs, addresses)
2. Replaces with anonymous tokens (`[EMAIL_1]`, `[PHONE_1]`, etc.)
3. Maintains mapping for context restoration (never sent to LLM)

### Role-Based Access Control
- **Admin**: Full access - manage agents, tickets, KB, view all data
- **Agent**: Handle assigned tickets, search KB, view own queue
- **End-User**: Submit queries, view own ticket status

---

## 📁 Project Structure

```
hurAI/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts (Auth)
│   │   ├── pages/            
│   │   │   ├── admin/         # Admin dashboard, tickets, KB
│   │   │   └── agent/         # Agent ticket queue and detail
│   │   ├── firebase.js        # Firebase client config
│   │   └── App.jsx            # Main app with routing
│   └── package.json
│
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── core/              # Core services
│   │   │   ├── classifier/    # Query classification
│   │   │   ├── database/      # Firebase operations
│   │   │   ├── escalation/    # Ticket escalation
│   │   │   ├── kb/            # Knowledge base & embeddings
│   │   │   ├── llm/           # LLM providers (Gemini/OpenAI)
│   │   │   ├── pii/           # PII detection & anonymization
│   │   │   └── router/        # Main routing logic
│   │   ├── routes/            # API route handlers
│   │   └── index.js           # Server entry point
│   ├── scripts/               # Utility scripts
│   └── package.json
│
├── discovery/                 # Project documentation
├── kb/                        # Sample knowledge base files
├── specs/                     # Sprint plans & user stories
└── README.md
```

---

## 🧪 Testing

### Test Console
Access the built-in test console at `http://localhost:3001/test-console.html`

### Example API Calls

**Route a query:**
```bash
curl -X POST http://localhost:3001/api/router/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I reset my password?"}'
```

**Test PII anonymization:**
```bash
curl -X POST http://localhost:3001/api/demo/pii \
  -H "Content-Type: application/json" \
  -d '{"text": "My email is john@example.com and phone is 555-1234"}'
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, CSS Modules |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Vector DB | Pinecone |
| LLM | Google Gemini, OpenAI GPT |

---



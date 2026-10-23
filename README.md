<div align="center">

# 🎙️ CallPilot AI
### Real-Time Speech Emotion Intelligence & Contact Center Telemetry

[![Live Frontend](https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://callpilot-ai-coral.vercel.app/)
[![Backend Status](https://img.shields.io/badge/API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://callpilotai-j4bd.onrender.com/)
[![ML Service](https://img.shields.io/badge/ML%20Engine-Azure%20Container%20Apps-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://callpilot-ml.calmsea-bf569f70.malaysiawest.azurecontainerapps.io/health)
[![Model](https://img.shields.io/badge/Model-WavLM%20%2B%20Attention-blueviolet?style=for-the-badge&logo=huggingface)](https://huggingface.co/microsoft/wavlm-base)

<p align="center">
  <b>CallPilot AI</b> is an intelligent voice telemetry and call center escalation platform. It leverages transformer-based speech representations (WavLM) to perform real-time speech emotion recognition, acoustic feature analysis, and frustration detection across live microphone streams and recorded customer calls.
</p>

</div>

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Machine Learning & Acoustic Engine](#-machine-learning--acoustic-engine)
- [Project Structure](#-project-structure)
- [Getting Started Locally](#-getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. ML Service Setup](#2-ml-service-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Deployment Strategy](#-deployment-strategy)
- [License](#-license)

---

## ✨ Key Features

- **Live Microphone Telemetry (`/ws/live`)**: Real-time bi-directional WebSocket streaming delivering sliding-window emotion scoring and acoustic feedback within ~100–250ms latency.
- **Audio File Analysis (`/api/audio/analyze`)**: Drag-and-drop batch analysis supporting WAV, MP3, FLAC, and OGG files up to 50MB with waveform visualization and chronological emotion breakdown.
- **Frustration & Escalation Detection**: Heuristic frustration telemetry tracking combined Anger + Disgust vectors to flag at-risk calls before customer churn.
- **Dual Dashboard Personas**:
  - **Administrator Portal**: Real-time KPI summaries, agent directory management, call resolution metrics, and macro emotion distribution charts.
  - **Agent Console**: Assigned call histories, live call monitoring, acoustic playback, and sentiment timeline breakdown.
- **Adaptive Dark / Light / System Theme**: Fully responsive UI engineered with Tailwind CSS v4, supporting dynamic color schemes, custom SVG charts, and persistent theme states.

---

## 🏛️ System Architecture

```
                          ┌──────────────────────────────────────┐
                          │          Client / Browser            │
                          │   React 19 SPA • Audio Worklet Mic   │
                          └──────────────┬────────────────┬──────┘
                                         │                │
                        REST API (Auth, DB)               │ Live WebSockets & Audio
                                         │                │ (16kHz PCM16 Chunks)
                                         ▼                ▼
┌──────────────────────────────────────────────┐    ┌──────────────────────────────────────────────┐
│             Backend API (Render)             │    │         ML Inference Engine (Azure)          │
│          Node.js 20 • Express 5 • TS         │    │           Python 3.10 • FastAPI              │
│       JWT Auth • Aggregation Pipelines       │    │     PyTorch CPU • WavLM-Base + Attention     │
└──────────────────────┬───────────────────────┘    └──────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           Database (MongoDB Atlas)           │
│        Users, Agents, Calls, Sessions        │
└──────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with class-based `@custom-variant dark` support
- **Icons**: [Lucide React](https://lucide.dev/)
- **State & Theme**: React Context API with `localStorage` persistence and `prefers-color-scheme` synchronization
- **Routing**: [React Router v7](https://reactrouter.com/) with SPA catch-all rewrites

### Backend API
- **Runtime**: [Node.js](https://nodejs.org/) (v20+) with ES Modules
- **Framework**: [Express 5](https://expressjs.com/) with TypeScript
- **Database & ODM**: [MongoDB Atlas](https://www.mongodb.com/atlas) with [Mongoose 9](https://mongoosejs.com/)
- **Security & Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, and CORS middleware
- **Seeders**: Automated administrative onboarding scripts

### Machine Learning & Audio Engine
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **Deep Learning**: [PyTorch](https://pytorch.org/) (CPU-optimized) + [Hugging Face Transformers](https://huggingface.co/docs/transformers)
- **Audio Processing**: [Librosa](https://librosa.org/), [SoundFile](https://python-soundfile.readthedocs.io/), and NumPy
- **Streaming**: Native asynchronous WebSockets with in-memory ring buffers and concurrency locks

---

## 🧠 Machine Learning & Acoustic Engine

The emotion intelligence pipeline is built on self-supervised speech representations:

- **Backbone Feature Extractor**: [`microsoft/wavlm-base`](https://huggingface.co/microsoft/wavlm-base) pre-trained on 960 hours of 16kHz speech.
- **Classification Head**: Custom Trainable Attention-Pooling Classifier (`AttentionClassifier`) mapping temporal speech embeddings to discrete emotion logits.
- **Trained Classes (6-Class SER)**:
  `Anger` • `Disgust` • `Fear` • `Happy` • `Neutral` • `Sad`
- **Training Dataset**: [CREMA-D](https://github.com/CheyneyComputerScience/CREMA-D) via Hugging Face using speaker-disjoint splits:
  - 4,672 training samples
  - 1,218 validation samples
  - 1,552 hold-out test samples
- **Inference Windowing**: 3.0-second temporal receptive field with 1.0-second sliding step for smooth real-time visualization.

---

## 📂 Project Structure

```text
CallPilotAI/
├── .github/
│   └── workflows/
│       └── deploy-ml.yml         # Automated CI/CD to Azure Container Apps
├── backend/
│   ├── src/
│   │   ├── config/               # Database connection (MongoDB Atlas)
│   │   ├── controllers/          # Auth, Agent, Call, Conversation controllers
│   │   ├── models/               # Mongoose schemas (User, Call, Agent)
│   │   ├── routes/               # Express API routing
│   │   ├── seeders/              # Admin account seed script
│   │   └── server.ts             # Express application entrypoint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                  # API clients (Render Backend & Azure ML)
│   │   ├── components/           # Common components, tables, charts, layout
│   │   ├── context/              # AuthContext and ThemeContext (Dark Mode)
│   │   ├── pages/                # Admin, Agent, Analytics, LiveMonitoring
│   │   ├── App.tsx
│   │   └── index.css             # Tailwind v4 theme tokens
│   ├── vercel.json               # SPA routing rewrite rules for Vercel
│   └── vite.config.ts
├── ml-service/
│   ├── app/
│   │   ├── controllers/          # Upload analysis & live WebSocket controllers
│   │   ├── models/               # PyTorch AttentionClassifier architecture
│   │   ├── routes/               # FastAPI route declarations
│   │   ├── services/             # Audio buffering, model loader, inference locks
│   │   └── main.py               # FastAPI entrypoint with CORS
│   ├── model/
│   │   ├── wavlm_attention_best.pth  # Trained model weights
│   │   └── project_metadata.json # Dataset & training metrics
│   ├── Dockerfile                # Production multi-stage CPU-optimized image
│   └── requirements.txt
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v20 or higher) & npm
- Python (v3.10 or higher) with `pip`
- MongoDB instance (local or MongoDB Atlas connection URI)
- Git

### 1. Backend Setup
```bash
cd backend
npm install

# Create environment configuration
cp .env.example .env # or create .env with MONGO_URI, JWT_SECRET, PORT=5000

# Seed initial administrative user (optional)
npm run seed:admin

# Start development server
npm run dev
```

### 2. ML Service Setup
```bash
cd ml-service

# Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies (CPU PyTorch recommended locally)
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt

# Start ML FastAPI server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/callpilotai
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=https://callpilotai-j4bd.onrender.com
VITE_ML_SERVICE_URL=https://callpilot-ml.calmsea-bf569f70.malaysiawest.azurecontainerapps.io
VITE_ML_WS_URL=wss://callpilot-ml.calmsea-bf569f70.malaysiawest.azurecontainerapps.io/ws/live
```

---

## 🌐 Deployment Strategy

CallPilot AI is deployed using a **Cost-Engineered Multi-Cloud Architecture** specifically designed to deliver low-latency speech inference while maintaining zero operational spend under student/free-tier cloud limits:

1. **Frontend Tier (Vercel)**:
   The React 19 SPA is hosted on [Vercel](https://callpilot-ai-coral.vercel.app/) via automated continuous deployment from the `main` branch. Assets are distributed globally across Vercel's Edge Network with automated SSL/TLS certificates and SPA client-side rewrite rules defined in `vercel.json`.
2. **Business API Tier (Render)**:
   The Node.js and Express backend is deployed as a managed Web Service on [Render](https://callpilotai-j4bd.onrender.com/). It compiles TypeScript on deployment, manages stateless JWT sessions, and interfaces directly with a managed cloud cluster on **MongoDB Atlas (M0 Shared Tier)**.
3. **Machine Learning & WebSocket Tier (Azure Container Apps)**:
   The heavy PyTorch and WavLM model runs as a containerized microservice on [Azure Container Apps](https://callpilot-ml.calmsea-bf569f70.malaysiawest.azurecontainerapps.io/) in the `Malaysia West` region. The Docker container is pre-baked with the `microsoft/wavlm-base` transformer weights and lightweight CPU PyTorch binaries, enabling cold-starts in under 3 seconds.
4. **Zero-Credit Burn Optimization**:
   By configuring Azure Container Apps on a Serverless Consumption profile with **`min-replicas: 0`**, the service automatically scales to zero when idle and only draws compute during active audio analysis or live microphone streams. The entire workload operates within Azure's permanent monthly free grant (180,000 vCPU-seconds and 360,000 GiB-seconds free every month), which completely preserved the user's $100 Azure for Students credit (**$0.00 spent**, 100% credit retained). Real-time live audio streams remain stable without mid-call disconnection because Envoy ingress automatically maintains persistent TCP WebSockets (`wss://`) as in-flight requests.

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
# NeuralVoid AI Workspace

> A full-stack SaaS platform for AI workflows, knowledge retrieval, prompt engineering, and custom agent development.

NeuralVoid is a collaborative AI developer platform built to design, deploy, and monitor custom artificial intelligence agents and complex data processing workflows.

[![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg)]()

## 🚀 Key Features

* **Authentication & Workspaces:** Secure user profiles, API key management, and session continuation.
* **Agent Builder & Knowledge Bases:** Equip custom agents with context using specific PDF documents and tailored knowledge retrieval architectures (RAG).
* **Prompt Studio:** Full version control over prompts across the development lifecycle, optimizing and refining LLM inputs.
* **Workflow Engine:** A node-based UI capable of defining sequential AI pipelines and tool chains.
* **Global Search:** Find anything across your workspaces, from workflows and prompts to session histories.
* **System Health & Usage Dashboard:** Comprehensive analytics detailing token volume, estimated costs, error thresholds, and system health.
* **Cost Optimization & Billing:** Simulated quota limits and credit renewals mirroring real-world SaaS deployment patterns.

## 🏗️ Architecture

```mermaid
graph TD
    UI[React Frontend - Vite + Tailwind] --> API Gateway
    API[Express API Gateway]
    
    API Gateway --> ServiceAuth[Authentication/Settings]
    API Gateway --> ServiceAgents[Agent & Workflow Manager]
    API Gateway --> ServiceMetrics[Usage Analytics Database]
    
    ServiceAgents --> ModelR[Model Router: Pro/Flash]
    ModelR --> LLM[Gemini API Backend]
    ServiceAgents --> VectorDB[Knowledge Base & PDF Storage]
```

* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion
* **Backend Module:** Express/Node API Server (Single-file container architecture)
* **Storage Engine:** Local JSON data stores for rapid prototyping, architected for eventual Prisma + PostgreSQL translation
* **AI Provider:** Google Cloud API (Gemini Family) via `@google/genai`

## 🛠️ Getting Started

### Prerequisites
* Node.js (v18+)
* Standard Web Browser
* Gemini API Key

### Setup Instructions

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Configure Environment Secrets:
Copy `.env.example` to `.env` and assign your keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Build and Start the application stack:
```bash
npm run dev
```

The application spins up multiple sub-services and bridges them locally to port 3000.

## 🤝 Roadmap & Future Evolutions

* **PostgreSQL Migration:** Transition state storage from file-based `data/db.json` over to robust SQL handling via `Prisma` engine.
* **True Team Collaboration:** Add roles (Owner, Editor, Viewer) via Role Based Access Controls for workspaces.
* **Agent Marketplace:** Allow teams to exchange refined agent behaviors within isolated company directories.
* **Agent Evaluation Lab:** Side-by-side prompt output testing determining precision, recall, latency, and operational cost differences for exact prompts sent to different LLMs simultaneously.

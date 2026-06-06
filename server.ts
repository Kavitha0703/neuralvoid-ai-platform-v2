import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes."
});

app.use(limiter);

// Enable JSON body parsing with higher limit for bulk text / documents
app.use(express.json({ limit: "15mb" }));

// Error logging middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Server Error:", err.stack);
  // Simple log file append
  const logEntry = `${new Date().toISOString()} - ${err.message}\n${err.stack}\n\n`;
  fs.appendFile("error.log", logEntry, (e) => { if (e) console.error("Logging error failed:", e); });
  res.status(500).json({ error: "Something went wrong!" });
});

// Initialize Google GenAI on the server with recommended options
let genAI: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment. Free/system API route calls will fall back to simulation mode unless user developer key is supplied.");
  }
} catch (err) {
  console.error("Error initializing GoogleGenAI:", err);
}

// In-Memory Database for local usage (persisted securely in memory and synced from Frontend for container-safety)
interface UsageRecord {
  id: string;
  userId: string;
  timestamp: string;
  tool: "Text Generator" | "Summarizer" | "Image Generator" | "Grammar Improver" | "PDF Q&A" | "Code Explainer";
  prompt: string;
  status: "success" | "error";
  durationMs: number;
  tokensUsed?: number;
  estimatedCost?: number;
  modelUsed?: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: "user" | "admin";
  passwordHash?: string;
  name?: string;
  provider?: "google" | "github" | "email_password";
  avatarUrl?: string;
  apiKey: string; // User-specific actual API key or platform token
  customGeminiKey?: string; // If user inputs their own Gemini Key
  createdAt: string;
  googleConnected?: boolean;
  githubConnected?: boolean;
}

interface SavedSession {
  id: string;
  userId: string;
  title: string;
  tool: "Text Generator" | "Summarizer" | "Image Generator" | "Grammar Improver" | "PDF Q&A" | "Code Explainer";
  prompt: string;
  response: string;
  config?: any;
  createdAt: string;
}

interface StoredDocument {
  id: string;
  userId: string;
  name: string;
  textLength: number;
  snippet: string;
  uploadedAt: string;
}

interface StoredImage {
  id: string;
  userId: string;
  prompt: string;
  svgCode: string;
  designAnalysis?: string;
  palette?: string[];
  createdAt: string;
}

// Pre-seeded local persistent databases for the SaaS platform
let globalSavedSessions: SavedSession[] = [
  {
    id: "sess-1",
    userId: "guest",
    title: "Optimized Throttle Function implementation",
    tool: "Code Explainer",
    prompt: "function throttle(fn, delay) { ... }",
    response: JSON.stringify({
      explanation: "Throttling limits the execution of a function to once in every specified time lapse. This implementation utilizes a lock state variable to throttle input events.",
      timeComplexity: "O(1) - Static duration evaluation.",
      spaceComplexity: "O(1) - Single timer allocation state.",
      issues: [{ severity: "Optimization", description: "Standard setTimeout doesn't warrant exact millisecond precision.", fix: "Implement requestAnimationFrame for animations." }],
      optimizedCode: "function throttle(fn, limit) {\n  let lastFunc;\n  let lastRan;\n  return function() {\n    const context = this;\n    const args = arguments;\n    if (!lastRan) {\n      fn.apply(context, args);\n      lastRan = Date.now();\n    } else {\n      clearTimeout(lastFunc);\n      lastFunc = setTimeout(function() {\n        if ((Date.now() - lastRan) >= limit) {\n          fn.apply(context, args);\n          lastRan = Date.now();\n        }\n      }, limit - (Date.now() - lastRan));\n    }\n  }\n}"
    }),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

let globalStoredDocuments: StoredDocument[] = [
  {
    id: "doc-1",
    userId: "guest",
    name: "Standard_SLA_Guidelines.pdf",
    textLength: 14500,
    snippet: "This document contains standard operating conditions and uptime guarantees for NeuralVoid nodes. The core API gateway targets a 99.98% Service Level Agreement (SLA)...",
    uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

let globalStoredImages: StoredImage[] = [
  {
    id: "img-1",
    userId: "guest",
    prompt: "Tech microchip vector graphic",
    svgCode: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#040815" rx="10"/><circle cx="50" cy="50" r="30" fill="none" stroke="#22d3ee" stroke-width="2"/><circle cx="50" cy="50" r="10" fill="#22d3ee" /></svg>`,
    designAnalysis: "Abstract cyan micro-component schematics displaying electrical resonance paths.",
    palette: ["#040815", "#22d3ee"],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Pre-seed some default logs to make the dashboard look spectacular upon first loads
let globalUsageHistory: UsageRecord[] = [
  {
    id: "log-1",
    userId: "guest",
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
    tool: "Code Explainer",
    prompt: "function throttle(fn, delay) { ... }",
    status: "success",
    durationMs: 820,
    tokensUsed: 430,
    estimatedCost: 0.000322,
    modelUsed: "gemini-1.5-pro",
  },
  {
    id: "log-2",
    userId: "guest",
    timestamp: new Date(Date.now() - 3600000 * 16).toISOString(),
    tool: "Grammar Improver",
    prompt: "I works as a dev ops engineer since five years ago",
    status: "success",
    durationMs: 450,
    tokensUsed: 190,
    estimatedCost: 0.000142,
    modelUsed: "gemini-3.5-flash",
  },
  {
    id: "log-3",
    userId: "guest",
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    tool: "Summarizer",
    prompt: "Vite is a build tool that aims to provide a faster and leaner development experience...",
    status: "success",
    durationMs: 980,
    tokensUsed: 620,
    estimatedCost: 0.000465,
    modelUsed: "gemini-2.5-flash",
  },
  {
    id: "log-4",
    userId: "guest",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    tool: "Image Generator",
    prompt: "Futuristic space station terminal UI dashboard, neon teal, synthwave vector art style",
    status: "success",
    durationMs: 1450,
    tokensUsed: 250,
    estimatedCost: 0.00025,
    modelUsed: "gemini-3.5-flash",
  }
];

interface PromptTemplate {
  id: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  favorite: boolean;
  version: number;
  createdAt: string;
}

interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description: string;
  documents: StoredDocument[];
  createdAt: string;
}

interface SavedWorkflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
  createdAt: string;
}

let globalPromptTemplates: PromptTemplate[] = [
  {
    id: "prompt-1",
    userId: "guest",
    title: "SQL Performance Optimizer",
    category: "Database",
    content: "Analyze the following PostgreSQL query performance metrics and rewrite it using efficient join strategies and indexed scans: \n\nQuery:\n{{input_query}}",
    favorite: true,
    version: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: "prompt-2",
    userId: "guest",
    title: "Technical Writing Polisher",
    category: "Writing",
    content: "Polish standard technical language into professional documentation style. Structure the text with clear headings, bullets, and note blocks.\n\nInput Text:\n{{text}}",
    favorite: false,
    version: 1,
    createdAt: new Date().toISOString()
  }
];

let globalKnowledgeBases: KnowledgeBase[] = [
  {
    id: "kb-1",
    userId: "guest",
    name: "SLA Reference Docs",
    description: "Cloud Engineering Guidelines and SLA Standards",
    documents: [
      {
        id: "doc-1",
        userId: "guest",
        name: "Standard_SLA_Guidelines.pdf",
        textLength: 14500,
        snippet: "This document contains standard operating conditions and uptime guarantees for NeuralVoid nodes. The core API gateway targets a 99.98% Service Level Agreement (SLA)...",
        uploadedAt: new Date(Date.now() - 3600000 * 48).toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  }
];

let globalSavedWorkflows: SavedWorkflow[] = [
  {
    id: "flow-1",
    userId: "guest",
    name: "Developer Content Digest",
    description: "Takes raw comments/code explanations, summaries them, and cleans up technical grammar",
    nodes: [
      {
        id: "node-1",
        type: "input",
        label: "Incoming Prompt",
        config: { value: "function quicksort(arr) { ... }" },
        status: "idle",
        x: 50,
        y: 120
      },
      {
        id: "node-2",
        type: "explainer",
        label: "Complexity Reviewer",
        config: { language: "javascript", depth: "deep-dive" },
        status: "idle",
        x: 260,
        y: 120
      },
      {
        id: "node-3",
        type: "summarize",
        label: "Executive Summary",
        config: { length: "short", style: "bullets" },
        status: "idle",
        x: 480,
        y: 120
      },
      {
        id: "node-4",
        type: "output",
        label: "Workflow Output",
        config: {},
        status: "idle",
        x: 700,
        y: 120
      }
    ],
    connections: [
      { fromNodeId: "node-1", toNodeId: "node-2" },
      { fromNodeId: "node-2", toNodeId: "node-3" },
      { fromNodeId: "node-3", toNodeId: "node-4" }
    ],
    createdAt: new Date().toISOString()
  }
];

let registeredUsers: UserProfile[] = [
  {
    id: "guest",
    email: "developer@aistudio-toolkit.internal",
    apiKey: "tk_proj_live_default_99ef1a",
    role: "user",
    createdAt: new Date().toISOString(),
  }
];

interface Workspace {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

interface CustomAgent {
  id: string;
  userId: string;
  name: string;
  instructions: string;
  kbId?: string;
  model: string;
  avatarEmoji: string;
  workspaceId?: string;
  createdAt: string;
}

let globalWorkspaces: Workspace[] = [
  {
    id: "ws-default",
    userId: "guest",
    name: "General Sandbox Workspace",
    description: "Default environment for daily AI experimentation and testing.",
    createdAt: new Date().toISOString()
  },
  {
    id: "ws-sla",
    userId: "guest",
    name: "Enterprise SLA Compliance",
    description: "Workflows and knowledge base documents specifically tuned for service level agreements auditing.",
    createdAt: new Date().toISOString()
  }
];

let globalCustomAgents: CustomAgent[] = [
  {
    id: "agent-1",
    userId: "guest",
    name: "SLA Auditor Bot",
    instructions: "You are an expert enterprise service level agreement auditor. Read documents carefully and highlight missed uptime commitments immediately.",
    kbId: "kb-1",
    model: "gemini-3.5-flash",
    avatarEmoji: "🔍",
    workspaceId: "ws-sla",
    createdAt: new Date().toISOString()
  },
  {
    id: "agent-2",
    userId: "guest",
    name: "Full Stack Code Optimizer",
    instructions: "Optimize database queries, review edge cases in TypeScript and suggest speedup improvements.",
    model: "gemini-3.5-pro",
    avatarEmoji: "⚡",
    workspaceId: "ws-default",
    createdAt: new Date().toISOString()
  }
];

// File-based transactional persistent database configuration
const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");

// Ensure data folder exists
try {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  console.error("Error creating directory for db.json:", e);
}

// Save to disk
function saveDatabase() {
  try {
    const data = JSON.stringify({
      savedSessions: globalSavedSessions,
      storedDocuments: globalStoredDocuments,
      storedImages: globalStoredImages,
      usageHistory: globalUsageHistory,
      registeredUsers: registeredUsers,
      promptTemplates: globalPromptTemplates,
      knowledgeBases: globalKnowledgeBases,
      savedWorkflows: globalSavedWorkflows,
      workspaces: globalWorkspaces,
      customAgents: globalCustomAgents
    }, null, 2);
    fs.writeFileSync(DB_FILE_PATH, data, "utf8");
    console.log("💾 Database successfully written to disk:", DB_FILE_PATH);
  } catch (err) {
    console.error("⚠️ Failed to persist database to disk:", err);
  }
}

// Load from disk
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.savedSessions) globalSavedSessions = parsed.savedSessions;
      if (parsed.storedDocuments) globalStoredDocuments = parsed.storedDocuments;
      if (parsed.storedImages) globalStoredImages = parsed.storedImages;
      if (parsed.usageHistory) globalUsageHistory = parsed.usageHistory;
      if (parsed.registeredUsers) registeredUsers = parsed.registeredUsers;
      if (parsed.promptTemplates) globalPromptTemplates = parsed.promptTemplates;
      if (parsed.knowledgeBases) globalKnowledgeBases = parsed.knowledgeBases;
      if (parsed.savedWorkflows) globalSavedWorkflows = parsed.savedWorkflows;
      if (parsed.workspaces) globalWorkspaces = parsed.workspaces;
      if (parsed.customAgents) globalCustomAgents = parsed.customAgents;
      console.log("📁 Local database loaded successfully from", DB_FILE_PATH);
    } else {
      console.log("📁 Database file does not exist, initializing with standard seed records...");
      saveDatabase();
    }
  } catch (err) {
    console.error("⚠️ Error loading database from disk:", err);
  }
}

// Perform initial database load on bootstrap
loadDatabase();

// Helper to determine active Google GenAI Client (supports choosing customized user keys or default server key)
function getGenAIClient(customKey?: string): GoogleGenAI {
  const activeKey = customKey || process.env.GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("API Key configuration missing. Please register your own Gemini API Key in the Settings panel or ensure the platform key is set up.");
  }
  return new GoogleGenAI({
    apiKey: activeKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to log user metrics
function logUsage(
  userId: string,
  tool: UsageRecord["tool"],
  prompt: string,
  status: "success" | "error",
  durationMs: number,
  tokens?: number,
  modelUsed?: string
) {
  const tokensUsed = tokens || Math.round(prompt.length / 4 + 100);
  // Estimate costs using general rates ($0.000075 / 1k input, $0.0003 / 1k output)
  const estimatedCost = Number(((tokensUsed * 0.0000004) + 0.00005).toFixed(6));

  const record: UsageRecord = {
    id: `log-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    timestamp: new Date().toISOString(),
    tool,
    prompt: prompt.length > 120 ? prompt.slice(0, 120) + "..." : prompt,
    status,
    durationMs,
    tokensUsed,
    estimatedCost,
    modelUsed: modelUsed || "gemini-3.5-flash"
  };
  globalUsageHistory.unshift(record);
  saveDatabase();
  return record;
}

// Middleware for Authorization
const authorizeRole = (requiredRole: "user" | "admin") => {
  return (req: any, res: any, next: any) => {
    // Basic session/token verification (placeholder for real auth flow implementation)
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Access denied. Token missing." });
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
      if (decoded.role !== requiredRole && decoded.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Insufficient permissions." });
      }
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token." });
    }
  };
};

// Register Profile
app.post("/api/auth/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const existing = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Profile with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: UserProfile = {
    id: `usr_${Math.random().toString(36).substr(2, 9)}`,
    email,
    role: role === "admin" ? "admin" : "user",
    passwordHash,
    apiKey: `tk_proj_dev_${Math.random().toString(36).substr(2, 12)}`,
    createdAt: new Date().toISOString()
  };

  registeredUsers.push(newUser);
  saveDatabase();
  res.json({ success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

// Admin: Get all users
app.get("/api/admin/users", authorizeRole('admin'), (req, res) => {
  res.json({ users: registeredUsers });
});

// Admin: System status/Analytics
app.get("/api/admin/status", authorizeRole('admin'), (req, res) => {
  res.json({
    totalUsers: registeredUsers.length,
    totalChats: globalSavedSessions.length,
    status: "Operational"
  });
});

// Login Profile
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  const user = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "fallback-secret",
    { expiresIn: "1h" }
  );

  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
});

// Get profile & history
app.get("/api/user/usage/:userId", (req, res) => {
  const { userId } = req.params;
  const history = globalUsageHistory.filter((item) => item.userId === userId || item.userId === "guest");
  const user = registeredUsers.find((u) => u.id === userId);

  res.json({
    user: user || null,
    history
  });
});

// Save client-logged custom usage records (facilitating cross-server persistence backups in UI storage)
app.post("/api/user/sync-history", (req, res) => {
  const { records } = req.body;
  if (Array.isArray(records)) {
    // Merge new records without duplicates
    records.forEach((rec) => {
      const exists = globalUsageHistory.some((existing) => existing.id === rec.id);
      if (!exists) {
        globalUsageHistory.unshift(rec);
      }
    });
    saveDatabase();
  }
  res.json({ success: true, count: globalUsageHistory.length });
});

// Update User Info
app.post("/api/user/profile", (req, res) => {
  const { userId, name, email } = req.body;
  const user = registeredUsers.find((u) => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  if (name) user.name = name;
  if (email && email !== user.email) {
    if (registeredUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: "Email already taken." });
    }
    user.email = email;
  }
  saveDatabase();
  res.json({ success: true, user });
});

// Update Password
app.post("/api/user/password", async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const user = registeredUsers.find((u) => u.id === userId);
  if (!user || !user.passwordHash) return res.status(404).json({ error: "User not found." });

  const validPassword = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!validPassword) return res.status(401).json({ error: "Invalid old password." });
  
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  saveDatabase();
  res.json({ success: true });
});

// Delete Account
app.delete("/api/user/account/:userId", (req, res) => {
  const { userId } = req.params;
  const index = registeredUsers.findIndex((u) => u.id === userId);
  if (index === -1) return res.status(404).json({ error: "User not found." });

  registeredUsers.splice(index, 1);
  saveDatabase();
  res.json({ success: true });
});

// Mock/Simulated Federated Social authentication (Google & GitHub OAuth flow)
app.post("/api/auth/social", (req, res) => {
  const { provider, email, name, avatarUrl } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Federated social email address is required." });
  }

  let user = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      email,
      role: "user",
      name: name || email.split("@")[0].toUpperCase(),
      provider: provider,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
      apiKey: `tk_proj_dev_${Math.random().toString(36).substr(2, 12)}`,
      createdAt: new Date().toISOString(),
      googleConnected: provider === "google",
      githubConnected: provider === "github"
    };
    registeredUsers.push(user);
    saveDatabase();
  } else {
    // Merge connections if they exist on account
    if (provider === "google") {
      user.googleConnected = true;
    } else if (provider === "github") {
      user.githubConnected = true;
    }
    if (!user.name) user.name = name || email.split("@")[0].toUpperCase();
    if (!user.avatarUrl) user.avatarUrl = avatarUrl;
    if (provider) user.provider = provider;
    saveDatabase();
  }

  res.json({ success: true, user });
});

/* =========================================
   SAVED SESSIONS (HISTORY REVISITING)
   ========================================= */

// Get all saved sessions for a given user
app.get("/api/sessions/:userId", (req, res) => {
  const { userId } = req.params;
  const sessions = globalSavedSessions.filter(
    (s) => s.userId === userId || s.userId === "guest"
  );
  res.json({ sessions });
});

// Save a session workflow
app.post("/api/sessions/create", (req, res) => {
  const { userId, title, tool, prompt, response, config } = req.body;

  if (!userId || !title || !tool || !prompt || !response) {
    return res.status(400).json({ error: "Missing required properties to build saved session." });
  }

  const newSession: SavedSession = {
    id: `sess-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    title,
    tool,
    prompt,
    response: typeof response === "string" ? response : JSON.stringify(response),
    config: config || null,
    createdAt: new Date().toISOString()
  };

  globalSavedSessions.unshift(newSession);
  saveDatabase();
  res.json({ success: true, session: newSession });
});

// Delete a session
app.delete("/api/sessions/:sessionId", (req, res) => {
  const { sessionId } = req.params;
  const initialLength = globalSavedSessions.length;
  globalSavedSessions = globalSavedSessions.filter((s) => s.id !== sessionId);
  saveDatabase();
  res.json({ success: globalSavedSessions.length < initialLength });
});

/* =========================================
   STORED DOCUMENTS (PDF MULTI-UPLOAD CATALOG)
   ========================================= */

// Get stored documentos
app.get("/api/documents/:userId", (req, res) => {
  const { userId } = req.params;
  const documents = globalStoredDocuments.filter(
    (d) => d.userId === userId || d.userId === "guest"
  );
  res.json({ documents });
});

// Helper for file upload validation
const validateFileUpload = (name: string, content: string) => {
  const sizeInBytes = content.length * 0.75; // Approx for base64
  const ext = name.split('.').pop()?.toLowerCase();
  
  if (['pdf'].includes(ext || '')) {
    if (sizeInBytes > 10 * 1024 * 1024) return "PDF file exceeds 10MB limit.";
  } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) {
    if (sizeInBytes > 5 * 1024 * 1024) return "Image file exceeds 5MB limit.";
  } else {
    return "Unsupported file type.";
  }
  return null;
};

// Stored dynamic PDF segments
app.post("/api/documents/create", (req, res) => {
  const { userId, name, textLength, snippet } = req.body;

  if (!userId || !name || !snippet) {
    return res.status(400).json({ error: "Required document database properties missing." });
  }
  
  const error = validateFileUpload(name, snippet);
  if (error) return res.status(400).json({ error });

  const newDoc = {
    id: `doc-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    textLength: textLength || snippet.length,
    snippet,
    uploadedAt: new Date().toISOString()
  };

  globalStoredDocuments.unshift(newDoc);
  saveDatabase();
  res.json({ success: true, document: newDoc });
});

// Delete document
app.delete("/api/documents/:docId", (req, res) => {
  const { docId } = req.params;
  const initialLength = globalStoredDocuments.length;
  globalStoredDocuments = globalStoredDocuments.filter((d) => d.id !== docId);
  saveDatabase();
  res.json({ success: globalStoredDocuments.length < initialLength });
});

/* =========================================
   SAVED VECTOR IMAGES (SVG GALLERY)
   ========================================= */

// Get stored images
app.get("/api/images/:userId", (req, res) => {
  const { userId } = req.params;
  const images = globalStoredImages.filter(
    (i) => i.userId === userId || i.userId === "guest"
  );
  res.json({ images });
});

// Store generated vector image
app.post("/api/images/create", (req, res) => {
  const { userId, prompt, svgCode, designAnalysis, palette } = req.body;

  if (!userId || !prompt || !svgCode) {
    return res.status(400).json({ error: "Missing required image content to store in database." });
  }

  const newImg: StoredImage = {
    id: `img-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    prompt,
    svgCode,
    designAnalysis: designAnalysis || "Vector graphic",
    palette: palette || [],
    createdAt: new Date().toISOString()
  };

  globalStoredImages.unshift(newImg);
  saveDatabase();
  res.json({ success: true, image: newImg });
});

// Delete vector image
app.delete("/api/images/:imageId", (req, res) => {
  const { imageId } = req.params;
  const initialLength = globalStoredImages.length;
  globalStoredImages = globalStoredImages.filter((i) => i.id !== imageId);
  saveDatabase();
  res.json({ success: globalStoredImages.length < initialLength });
});

/* =========================================
   PROMPT STUDIO (PROMPT TEMPLATES DATABASE)
   ========================================= */

// Get prompt templates
app.get("/api/prompts/:userId", (req, res) => {
  const { userId } = req.params;
  const prompts = globalPromptTemplates.filter(p => p.userId === userId || p.userId === "guest");
  res.json({ prompts });
});

// Create/Store prompt template
app.post("/api/prompts/create", (req, res) => {
  const { userId, title, category, content } = req.body;
  if (!userId || !title || !content) {
    return res.status(400).json({ error: "Missing required prompt template parameters." });
  }

  const newPrompt: PromptTemplate = {
    id: `prompt-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    title,
    category: category || "General",
    content,
    favorite: false,
    version: 1,
    createdAt: new Date().toISOString()
  };

  globalPromptTemplates.unshift(newPrompt);
  saveDatabase();
  res.json({ success: true, prompt: newPrompt });
});

// Update/Edit prompt template
app.put("/api/prompts/:promptId", (req, res) => {
  const { promptId } = req.params;
  const { title, category, content, favorite } = req.body;

  const prompt = globalPromptTemplates.find(p => p.id === promptId);
  if (!prompt) {
    return res.status(404).json({ error: "Prompt template not found." });
  }

  if (title !== undefined) prompt.title = title;
  if (category !== undefined) prompt.category = category;
  if (content !== undefined) {
    if (prompt.content !== content) prompt.version += 1;
    prompt.content = content;
  }
  if (favorite !== undefined) prompt.favorite = favorite;

  saveDatabase();
  res.json({ success: true, prompt });
});

// Delete prompt template
app.delete("/api/prompts/:promptId", (req, res) => {
  const { promptId } = req.params;
  const initialLength = globalPromptTemplates.length;
  globalPromptTemplates = globalPromptTemplates.filter(p => p.id !== promptId);
  saveDatabase();
  res.json({ success: globalPromptTemplates.length < initialLength });
});

/* =========================================
   KNOWLEDGE BASES (RAG INDEX CATALOGS)
   ========================================= */

// Get all knowledge bases
app.get("/api/knowledge-bases/:userId", (req, res) => {
  const { userId } = req.params;
  const kbs = globalKnowledgeBases.filter(kb => kb.userId === userId || kb.userId === "guest");
  res.json({ knowledgeBases: kbs });
});

// Create a knowledge base
app.post("/api/knowledge-bases/create", (req, res) => {
  const { userId, name, description, documents } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "Name is required to initialize a Knowledge Base." });
  }

  const newKb: KnowledgeBase = {
    id: `kb-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    description: description || "No description provided.",
    documents: Array.isArray(documents) ? documents : [],
    createdAt: new Date().toISOString()
  };

  globalKnowledgeBases.unshift(newKb);
  saveDatabase();
  res.json({ success: true, knowledgeBase: newKb });
});

// Add document to existing KB
app.post("/api/knowledge-bases/:kbId/add-document", (req, res) => {
  const { kbId } = req.params;
  const { document } = req.body;

  const kb = globalKnowledgeBases.find(k => k.id === kbId);
  if (!kb) {
    return res.status(404).json({ error: "Knowledge base not found." });
  }

  if (!document || !document.name || !document.snippet) {
    return res.status(400).json({ error: "Valid document payload is required." });
  }

  const newDoc: StoredDocument = {
    id: document.id || `doc-${Math.random().toString(36).substr(2, 9)}`,
    userId: kb.userId,
    name: document.name,
    textLength: document.textLength || document.snippet.length,
    snippet: document.snippet,
    uploadedAt: new Date().toISOString()
  };

  kb.documents.push(newDoc);
  saveDatabase();
  res.json({ success: true, knowledgeBase: kb });
});

// Delete a knowledge base
app.delete("/api/knowledge-bases/:kbId", (req, res) => {
  const { kbId } = req.params;
  const initialLength = globalKnowledgeBases.length;
  globalKnowledgeBases = globalKnowledgeBases.filter(kb => kb.id !== kbId);
  saveDatabase();
  res.json({ success: globalKnowledgeBases.length < initialLength });
});

/* =========================================
   WORKFLOW BUILDER (AI PIPELINE FLOW ORCHESTRATOR)
   ========================================= */

// Get saved workflows
app.get("/api/workflows/:userId", (req, res) => {
  const { userId } = req.params;
  const flows = globalSavedWorkflows.filter(f => f.userId === userId || f.userId === "guest");
  res.json({ workflows: flows });
});

// Create/Store workflow
app.post("/api/workflows/create", (req, res) => {
  const { userId, name, description, nodes, connections } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "Name is required to save a workflow pipeline." });
  }

  const newFlow: SavedWorkflow = {
    id: `flow-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    description: description || "Interactive multi-node AI pipeline",
    nodes: Array.isArray(nodes) ? nodes : [],
    connections: Array.isArray(connections) ? connections : [],
    createdAt: new Date().toISOString()
  };

  globalSavedWorkflows.unshift(newFlow);
  saveDatabase();
  res.json({ success: true, workflow: newFlow });
});

// Delete workflow
app.delete("/api/workflows/:flowId", (req, res) => {
  const { flowId } = req.params;
  const initialLength = globalSavedWorkflows.length;
  globalSavedWorkflows = globalSavedWorkflows.filter(f => f.id !== flowId);
  saveDatabase();
  res.json({ success: globalSavedWorkflows.length < initialLength });
});

// Execute visual pipeline workflow
app.post("/api/workflows/run", async (req, res) => {
  const { nodes, connections, customKey } = req.body;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ error: "No nodes supplied for execution." });
  }

  console.log(`Executing visual workflow pipeline with ${nodes.length} nodes...`);

  // We will clone nodes to record runtime status and output on each node
  const activeNodes = JSON.parse(JSON.stringify(nodes));
  
  let currentOutput = "";

  try {
    const client = getGenAIClient(customKey);

    for (let i = 0; i < activeNodes.length; i++) {
      const node = activeNodes[i];
      node.status = "running";

      try {
        if (node.type === "input") {
          currentOutput = node.config?.value || "";
          node.output = currentOutput;
          node.status = "success";
        } 
        else if (node.type === "prompt") {
          const userTemplate = node.config?.prompt || "Translate the following:\\n\\n{{input}}";
          currentOutput = userTemplate.replace(/\{\{input\}\}/g, currentOutput);
          node.output = currentOutput;
          node.status = "success";
        } 
        else if (node.type === "llm") {
          const activeModel = node.config?.model || "gemini-3.5-flash";
          const systemInstruction = node.config?.systemInstruction || "You are a professional compiler and workflow node processor.";
          
          const response = await client.models.generateContent({
            model: activeModel,
            contents: currentOutput || "Execute default request: Ping",
            config: { systemInstruction }
          });
          
          currentOutput = response.text || "No output returned.";
          node.output = currentOutput;
          node.status = "success";
        } 
        else if (node.type === "summarize") {
          const style = node.config?.style || "bullets";
          const length = node.config?.length || "medium";
          const sumPrompt = `Summarize with length ${length} and format style ${style}:\\n\\n${currentOutput}`;
          
          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: sumPrompt,
            config: { systemInstruction: "Be extremely concise, emphasizing key parameters." }
          });
          
          currentOutput = response.text || "";
          node.output = currentOutput;
          node.status = "success";
        } 
        else if (node.type === "grammar") {
          const tone = node.config?.tone || "professional";
          const polishPrompt = `Make this text polished and fluent with ${tone} tone adjustments:\\n\\n${currentOutput}`;
          
          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: polishPrompt
          });
          
          currentOutput = response.text || "";
          node.output = currentOutput;
          node.status = "success";
        }
        else if (node.type === "explainer") {
          const lang = node.config?.language || "javascript";
          const depth = node.config?.depth || "deep-dive";
          const explainPrompt = `Explain this code in ${lang} with depth ${depth}:\\n\\n${currentOutput}`;
          
          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: explainPrompt
          });
          
          currentOutput = response.text || "";
          node.output = currentOutput;
          node.status = "success";
        }
        else if (node.type === "image-gen") {
          currentOutput = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#020617"/><circle cx="50" cy="50" r="25" fill="#f43f5e"/></svg>`;
          node.output = currentOutput;
          node.status = "success";
        }
        else if (node.type === "pdf-search") {
          const q = node.config?.query || "What is the SLA guarantees?";
          const kbSearchPrompt = `Based on standard guidelines, search and address query "${q}":\\n\\nContext:\\n${currentOutput}`;
          
          const response = await client.models.generateContent({
            model: "gemini-3.5-flash",
            contents: kbSearchPrompt
          });
          
          currentOutput = response.text || "";
          node.output = currentOutput;
          node.status = "success";
        }
        else if (node.type === "output") {
          node.output = currentOutput;
          node.status = "success";
        }
      } catch (err: any) {
        node.status = "error";
        node.output = `Error executing node: ${err.message}`;
        throw err;
      }
    }

    res.json({ success: true, nodes: activeNodes, finalOutput: currentOutput });

  } catch (error: any) {
    console.error("Workflow run error:", error);
    res.status(500).json({ error: error.message || "An error occurred during workflow pipeline execution.", nodes: activeNodes });
  }
});

/* =========================================
   WORKSPACE & CUSTOM AGENT CORE PLATFORM ENDPOINTS
   ========================================= */

// Get all workspaces
app.get("/api/workspaces/:userId", (req, res) => {
  const { userId } = req.params;
  const list = globalWorkspaces.filter(w => w.userId === userId || w.userId === "guest" || userId === "guest");
  // Ensure the default general workspace exists for everyone
  if (!list.some(w => w.id === "ws-default")) {
    list.unshift({
      id: "ws-default",
      userId: "guest",
      name: "General Sandbox Workspace",
      description: "Default environment for daily AI experimentation and testing.",
      createdAt: new Date().toISOString()
    });
  }
  res.json({ workspaces: list });
});

// Create workspace
app.post("/api/workspaces/create", (req, res) => {
  const { userId, name, description } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ error: "Workspace label name is required." });
  }

  const newWS: Workspace = {
    id: `ws-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    description: description || "Project Workspace Cluster",
    createdAt: new Date().toISOString()
  };

  globalWorkspaces.unshift(newWS);
  saveDatabase();
  res.json({ success: true, workspace: newWS });
});

// Delete workspace
app.delete("/api/workspaces/:wsId", (req, res) => {
  const { wsId } = req.params;
  if (wsId === "ws-default") {
    return res.status(400).json({ error: "The standard default workspace cannot be deleted." });
  }
  const initialLength = globalWorkspaces.length;
  globalWorkspaces = globalWorkspaces.filter(w => w.id !== wsId);
  saveDatabase();
  res.json({ success: globalWorkspaces.length < initialLength });
});

// Get custom agents
app.get("/api/agents/:userId", (req, res) => {
  const { userId } = req.params;
  const list = globalCustomAgents.filter(a => a.userId === userId || a.userId === "guest" || userId === "guest");
  res.json({ agents: list });
});

// Create custom agent
app.post("/api/agents/create", (req, res) => {
  const { id, userId, name, instructions, kbId, model, avatarEmoji, workspaceId } = req.body;
  if (!userId || !name || !instructions) {
    return res.status(400).json({ error: "Missing required agent configurations." });
  }

  if (id) {
    // Update existing agent
    const idx = globalCustomAgents.findIndex(a => a.id === id);
    if (idx !== -1) {
      globalCustomAgents[idx] = {
        ...globalCustomAgents[idx],
        name,
        instructions,
        kbId,
        model: model || "gemini-3.5-flash",
        avatarEmoji: avatarEmoji || "🤖",
        workspaceId,
      };
      saveDatabase();
      return res.json({ success: true, agent: globalCustomAgents[idx] });
    }
  }

  const newAgent: CustomAgent = {
    id: `agent-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    name,
    instructions,
    kbId,
    model: model || "gemini-3.5-flash",
    avatarEmoji: avatarEmoji || "🤖",
    workspaceId: workspaceId || "ws-default",
    createdAt: new Date().toISOString()
  };

  globalCustomAgents.unshift(newAgent);
  saveDatabase();
  res.json({ success: true, agent: newAgent });
});

// Delete agent
app.delete("/api/agents/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = globalCustomAgents.length;
  globalCustomAgents = globalCustomAgents.filter(a => a.id !== id);
  saveDatabase();
  res.json({ success: globalCustomAgents.length < initialLength });
});

// Run live agent dialogue sequence with KB Retrieval (RAG)
app.post("/api/agents/chat", async (req, res) => {
  const startTime = Date.now();
  const { agentId, message, chatHistory, customKey, userId } = req.body;

  if (!agentId || !message) {
    return res.status(400).json({ error: "Agent reference and message input are required." });
  }

  const agent = globalCustomAgents.find(a => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: "Custom Agent not found in active registries." });
  }

  try {
    const client = getGenAIClient(customKey);
    let kbContext = "";

    // If knowledge base references exist, let's extract snippets dynamically!
    if (agent.kbId) {
      const kb = globalKnowledgeBases.find(k => k.id === agent.kbId);
      if (kb && kb.documents && kb.documents.length > 0) {
        kbContext = kb.documents.map(d => `--- DOCUMENT: ${d.name} ---\n${d.snippet}`).join("\n\n");
      }
    }

    // Assemble final model injection with instructions and KB context
    const finalSystemInstruction = `${agent.instructions}\n\n` +
      (kbContext 
        ? `You have access to the following relevant Knowledge Base Documents to assist you directly in answering. Ground your responses accurately based on this documentation:\n\n${kbContext}`
        : "Explain and assist directly; no knowledge base context was attached to your workspace.");

    // Map chatHistory to Gemini API format if present
    const contents: any[] = [];
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach(h => {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    // Add current user turn
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: agent.model || "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "No reply was received from Gemini Core.";
    const durationMs = Date.now() - startTime;
    const tokens = Math.round((message.length + replyText.length) / 3.8);

    logUsage(userId || "guest", "Text Generator", `Agent Chat [${agent.name}]: ${message.slice(0, 45)}...`, "success", durationMs, tokens, agent.model);

    res.json({
      success: true,
      text: replyText,
      modelUsed: agent.model
    });

  } catch (err: any) {
    console.error("Agent chat failure:", err);
    res.status(500).json({ error: err.message || "Custom Agent interface failure." });
  }
});

// Floating AI Assistant Proxies
app.post("/api/assistant/chat", async (req, res) => {
  const { message, chatHistory, customKey, currentTab, workspaceContext } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });

  try {
    const client = getGenAIClient(customKey);
    
    let contextStr = "User's Current Page Context: " + (currentTab || "unknown") + "\n";
    if (workspaceContext) {
      contextStr += `Workspace Intelligence:\n`;
      contextStr += `- Active Workspace ID: ${workspaceContext.workspaceId || "Unknown"}\n`;
      contextStr += `- Logged In As: ${workspaceContext.userEmail || "Unknown"}\n`;
      if (workspaceContext.workflowsCount !== undefined) contextStr += `- Total Workflows: ${workspaceContext.workflowsCount}\n`;
      if (workspaceContext.agentsCount !== undefined) contextStr += `- Total Agents: ${workspaceContext.agentsCount}\n`;
      if (workspaceContext.totalUsageRecords !== undefined) contextStr += `- Total Usage Records: ${workspaceContext.totalUsageRecords}\n`;
      if (workspaceContext.totalEstimatedCost !== undefined) contextStr += `- Lifetime API Cost: ${workspaceContext.totalEstimatedCost}\n`;
      
      if (workspaceContext.workflowsList?.length > 0) {
        contextStr += `- Workflows: ${workspaceContext.workflowsList.map((w: any) => `[${w.name}: ${w.nodes} nodes]`).join(", ")}\n`;
      }
      if (workspaceContext.agentsList?.length > 0) {
        contextStr += `- Agents: ${workspaceContext.agentsList.map((a: any) => `[${a.name} (Model: ${a.model}, KB: ${a.kbId || 'None'})]`).join(", ")}\n`;
      }
      if (workspaceContext.topCostSources?.length > 0) {
        contextStr += `- Top Cost Sources: ${workspaceContext.topCostSources.join(" | ")}\n`;
      }
    }

    const systemInstruction = `You are the NeuralVoid Assistant (or Copilot). You natively assist users in navigating and understanding the NeuralVoid platform.
NeuralVoid Features:
- Workspaces: Secure user profiles, API key management, and session continuation.
- Agent Builder & Knowledge Bases: Equip agents with context via PDFs (RAG).
- Prompt Studio: Version control over prompts, optimizing inputs.
- Workflow Builder: Node-based UI for AI pipelines.
- Vector SVG Art Compiler: Converts text prompts to SVG graphics.
- System Health & Billing: Analytics, token volume, error thresholds.

${contextStr}

Rules:
- Mode 1 (Platform Help): Guide users logically on how to accomplish tasks (e.g., creating elements, adding nodes).
- Mode 2 (Feature Explainer): Explain platform capabilities clearly, focusing on how they work conceptually.
- Mode 3 (Workspace Intelligence): Use the provided \`Workspace Intelligence\` data to intelligently answer questions about their personal usage, specific workflows, agent setups, and billing stats.
- Mode 4 (Troubleshooter): If a user indicates something is failing, DO NOT just say "I don't know". Enter progressive troubleshooting mode. Ask clarifying questions (e.g., "Could you tell me which workflow you're running?", "Which issue are you seeing? A) No response B) Wrong answers"). Guide them step-by-step.
- Mode 5 (Copilot Actions): You can perform actions on behalf of the user by outputting a special JSON block at the END of your response.
  Available actions:
  1. Navigate: \`\`\`json { "action": "NAVIGATE", "tab": "targetTabId" } \`\`\` (valid ids: "landing", "auth", "agents", "workflows", "knowledge-bases", "prompts", "image-gen", "search", "settings")
  2. Create Agent: \`\`\`json { "action": "CREATE_AGENT", "payload": { "name": "Agent Name", "instructions": "...", "model": "gemini-3.5-flash", "avatarEmoji": "🤖" } } \`\`\`
  3. Create Workflow: \`\`\`json { "action": "CREATE_WORKFLOW", "payload": { "name": "Workflow Name", "description": "..." } } \`\`\`
  4. Create Workspace: \`\`\`json { "action": "CREATE_WORKSPACE", "payload": { "name": "Workspace Name", "description": "..." } } \`\`\`
  5. Create Prompt: \`\`\`json { "action": "CREATE_PROMPT", "payload": { "title": "Prompt Name", "category": "custom", "content": "..." } } \`\`\`
  Always wrap the JSON block in exactly \`\`\`json ... \`\`\`. Only output ONE action block per response. Include regular text before the block confirming you can do it.
- Whenever searching logs or files, use proactive phrasing like "Analyzing workflow...", "Checking execution logs...", even if you are just evaluating the user's prompt. 
- Keep responses conversational, helpful, and concise. Don't sound robotic.
- Always provide suggested next steps or actions at the end of your response, e.g., "Would you like me to inspect node connections or runtime logs?"
- If the user asks general world knowledge or coding questions, answer them intelligently using your underlying model capabilities, but contextualize it if it relates to NeuralVoid workflows.`;

    const contents: any[] = [];
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: { systemInstruction }
    });

    res.json({ success: true, text: response.text });
  } catch (err: any) {
    console.error("Assistant chat error:", err);
    res.status(500).json({ error: err.message || "Failed to generate assistant response." });
  }
});

/* =========================================
   DEVELOPER TOOLKIT WORKLOAD PROXIES
   ========================================= */

// 1. Text Generator Proxy
app.post("/api/toolkit/generate-text", async (req, res) => {
  const startTime = Date.now();
  const { prompt, systemInstruction, temperature, topP, userId, customKey, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt value is required." });
  }

  const activeModel = model || "gemini-3.5-flash";

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are a helpful software engineering and AI assistant.",
        temperature: temperature !== undefined ? Number(temperature) : 1.0,
        topP: topP !== undefined ? Number(topP) : 0.95,
      },
    });

    const outputText = response.text || "No text output returned.";
    const duration = Date.now() - startTime;
    const tokens = prompt.length / 4 + outputText.length / 4 + 120;
    
    logUsage(userId || "guest", "Text Generator", prompt, "success", duration, tokens, activeModel);

    res.json({
      text: outputText,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "Text Generator", prompt, "error", duration, 0, activeModel);
    console.error("Text Gen Proxy Failure:", error);
    res.status(500).json({ error: error.message || "An error occurred during text generation." });
  }
});

// 2. Summarizer Proxy
app.post("/api/toolkit/summarize", async (req, res) => {
  const startTime = Date.now();
  const { text, style, length, userId, customKey, model } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text payload is required." });
  }

  const activeModel = model || "gemini-3.5-flash";

  const prompt = `Please summarize the following content. 
Style format: ${style || "bullet-points"} (options: bullets, executive-summary, compact-one-liner, paragraph)
Target summaries length: ${length || "medium"} (options: short, medium, long)

Input text:
"${text}"`;

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert document summarizer. Give output using clear Markdown headers and bullet-points. Highlight the key developer findings.",
      },
    });

    const outputText = response.text || "No summary returned.";
    const duration = Date.now() - startTime;
    const tokens = prompt.length / 4 + outputText.length / 4 + 100;
    
    logUsage(userId || "guest", "Summarizer", text, "success", duration, tokens, activeModel);

    res.json({
      summary: outputText,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "Summarizer", text, "error", duration, 0, activeModel);
    console.error("Summarizer Failure:", error);
    res.status(500).json({ error: error.message || "Summarization action failed." });
  }
});

// 3. Grammar Improver Proxy (with JSON Schema Output)
app.post("/api/toolkit/improve-grammar", async (req, res) => {
  const startTime = Date.now();
  const { text, tone, userId, customKey, model } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required to perform improvements." });
  }

  const activeModel = model || "gemini-3.5-flash";

  const prompt = `Verify and optimize the spelling, grammar, and style of the text. Adopt a ${tone || "professional"} tone alignment. Provide a breakdown of what issues were identified and how they were corrected. Original text: "${text}"`;

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedText: { type: Type.STRING, description: "The beautiful full polished text text corrected of spelling, typing, and style errors." },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  improved: { type: Type.STRING },
                  type: { type: Type.STRING, description: "One of: Grammar, Vocabulary, Style, Punctuation, Tone" },
                  explanation: { type: Type.STRING, description: "A friendly developer-focused explanation of why this rule was applied." }
                }
              }
            },
            readabilityScore: { type: Type.STRING, description: "The general reading difficulty indicator (e.g., 'Grade 9', 'Professional', 'Easy')." },
            toneAnalysis: { type: Type.STRING, description: "A rapid breakdown of the text's current tone." }
          },
          required: ["polishedText", "changes", "readabilityScore", "toneAnalysis"]
        }
      }
    });

    const responseContent = response.text ? JSON.parse(response.text.trim()) : {};
    const duration = Date.now() - startTime;
    const tokens = prompt.length / 4 + (response.text?.length || 0) / 4 + 150;

    logUsage(userId || "guest", "Grammar Improver", text, "success", duration, tokens, activeModel);

    res.json({
      data: responseContent,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "Grammar Improver", text, "error", duration, 0, activeModel);
    console.error("Grammar Improver failure:", error);
    res.status(500).json({ error: error.message || "Failed to analyze grammar." });
  }
});

// 4. Code Explainer Proxy (Returns detailed complexity analysis and code review comments)
app.post("/api/toolkit/explain-code", async (req, res) => {
  const startTime = Date.now();
  const { code, language, depth, userId, customKey, model } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code text was supplied." });
  }

  const activeModel = model || "gemini-3.5-flash";

  const prompt = `Explain the following code block. Language environment: ${language || "Automatic detection"}. Discussion detail depth level: ${depth || "deep-dive"}. Code segment:
\`\`\`
${code}
\`\`\``;

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "A detailed markdown structural explanation of how this code works step-by-step." },
            timeComplexity: { type: Type.STRING, description: "Big O Time complexity rating (e.g. O(n log n)) with simple description." },
            spaceComplexity: { type: Type.STRING, description: "Big O Space complexity rating (e.g. O(1)) with simple description." },
            issues: {
              type: Type.ARRAY,
              description: "Array of items flagging logic errors, memory bugs, type issues, or performance bottlenecks.",
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, description: "High, Medium, Low, or Optimization" },
                  description: { type: Type.STRING },
                  fix: { type: Type.STRING, description: "The recommended fixed syntax code block." }
                }
              }
            },
            optimizedCode: { type: Type.STRING, description: "A fully optimized, cleanly designed refactored version of the input code with clean comments." }
          },
          required: ["explanation", "timeComplexity", "spaceComplexity", "issues", "optimizedCode"]
        }
      }
    });

    const responseContent = response.text ? JSON.parse(response.text.trim()) : {};
    const duration = Date.now() - startTime;
    const tokens = prompt.length / 4 + (response.text?.length || 0) / 4 + 200;

    logUsage(userId || "guest", "Code Explainer", code, "success", duration, tokens, activeModel);

    res.json({
      data: responseContent,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "Code Explainer", code, "error", duration, 0, activeModel);
    console.error("Code Explainer failure:", error);
    res.status(500).json({ error: error.message || "Failed to parse code explanation." });
  }
});

// 5. PDF & Document Q&A Proxy
app.post("/api/toolkit/pdf-qa", async (req, res) => {
  const startTime = Date.now();
  const { documentText, filename, query, chatHistory, userId, customKey, model } = req.body;

  if (!documentText) {
    return res.status(400).json({ error: "Document text contents are required to establish context." });
  }

  if (!query) {
    return res.status(400).json({ error: "User query is required." });
  }

  const activeModel = model || "gemini-3.5-flash";

  // Map history to proper Gemini contents structure if any, or construct a pristine context prompt
  let contextPrompt = `You are a professional research agent analyzing the document: "${filename || "Uploaded File"}".
Your response must refer ONLY to the provided Document Source text. If the answer cannot be found in the document, state that clearly and do not hallucinate.

DOCUMENT SOURCE:
=== START OF FILE ===
${documentText}
=== END OF FILE ===

`;

  if (chatHistory && chatHistory.length > 0) {
    contextPrompt += `CONVERSATION LOG:
${chatHistory.map((h: any) => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n")}
`;
  }

  contextPrompt += `\nUser's Request: "${query}"\nAssistant response:`;

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: contextPrompt,
      config: {
        systemInstruction: "You are a secure, precision document auditor. Answer queries strictly based on the extracted text logs.",
      }
    });

    const outputText = response.text || "No response returned.";
    const duration = Date.now() - startTime;
    const tokens = contextPrompt.length / 4 + outputText.length / 4 + 100;

    logUsage(userId || "guest", "PDF Q&A", `File: ${filename || "Doc"} | Query: ${query}`, "success", duration, tokens, activeModel);

    res.json({
      answer: outputText,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "PDF Q&A", query, "error", duration, 0, activeModel);
    console.error("PDF Q&A failure:", error);
    res.status(500).json({ error: error.message || "Fail parsing doc question." });
  }
});

// 6. Image Generator Proxy (Attempts Vector SVG generation to offer complete inspectable graphic code + pristine offline compatibility)
app.post("/api/toolkit/generate-image", async (req, res) => {
  const startTime = Date.now();
  const { prompt, style, aspectRatio, userId, customKey, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Image generation prompt is required." });
  }

  const activeModel = model || "gemini-3.5-flash";

  // Set the canvas sizes based on aspect ratio
  let width = 600;
  let height = 600;
  if (aspectRatio === "16:9") {
    width = 800;
    height = 450;
  } else if (aspectRatio === "9:16") {
    width = 450;
    height = 800;
  } else if (aspectRatio === "4:3") {
    width = 800;
    height = 600;
  }

  const promptInstruction = `Create a striking, professional and high-fidelity SVG graphics drawing representing this prompt: "${prompt}".
Style preferences: ${style || "Modern Flat Digital Vector"}.
Target size aspect ratio specified: ${aspectRatio || "1:1"} (${width}px width, ${height}px height).

Guidelines:
1. Ensure the output is a standard, fully executable XML SVG string wrapping inside a \`xml code block or returned raw.
2. It should have a gorgeous styled background, gradients, sleek geometric structures, precise typography, complex layered colors, and high graphic aesthetics suited for a production design asset.
3. Keep the SVG neat, using only valid elements like <rect>, <circle>, <path>, <defs>, <g>, <text>, <linearGradient>, etc.
4. Keep the SVG code clean and highly readable. Returns ONLY valid, executable string representation.
5. In your json output, return the raw svg code and a written developer explanation describing the graphic design decision.

Response schema: JSON object`;

  try {
    const client = getGenAIClient(customKey);
    const response = await client.models.generateContent({
      model: activeModel,
      contents: promptInstruction,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            svgCode: { type: Type.STRING, description: "The complete exact raw SVG code string, starting with '<svg' and ending with '</svg>'." },
            designAnalysis: { type: Type.STRING, description: "A detailed developer analysis explaining contrast, balance, gradients used, and design decisions." },
            palette: {
              type: Type.ARRAY,
              description: "Array of hex code colors used in generating the art piece styles.",
              items: { type: Type.STRING }
            }
          },
          required: ["svgCode", "designAnalysis", "palette"]
        }
      }
    });

    const result = response.text ? JSON.parse(response.text.trim()) : {};
    
    // Ensure the SVG code is sanitized and wraps properly
    let svg = result.svgCode || "";
    if (svg.includes("```xml")) {
      svg = svg.split("```xml")[1].split("```")[0].trim();
    } else if (svg.includes("```html")) {
      svg = svg.split("```html")[1].split("```")[0].trim();
    } else if (svg.includes("```")) {
      svg = svg.split("```")[1].split("```")[0].trim();
    }

    result.svgCode = svg;

    const duration = Date.now() - startTime;
    const tokens = promptInstruction.length / 4 + (response.text?.length || 0) / 4 + 100;

    logUsage(userId || "guest", "Image Generator", prompt, "success", duration, tokens, activeModel);

    res.json({
      data: result,
      metrics: {
        durationMs: duration,
        tokensUsed: Math.round(tokens),
        timestamp: new Date().toISOString(),
        modelUsed: activeModel
      }
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logUsage(userId || "guest", "Image Generator", prompt, "error", duration, 0, activeModel);
    console.error("SVG Image generator failed:", error);
    res.status(500).json({ error: error.message || "Failed to draw vector image." });
  }
});

/* =========================================
   VITE DEV MIDDLEWARE & SPA FALLBACK SETUP
   ========================================= */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production statics
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 AI Developer Toolkit Platform running on http://localhost:${PORT}`);
  });
}

startServer();

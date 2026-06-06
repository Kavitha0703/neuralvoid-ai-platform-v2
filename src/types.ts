/**
 * AI Developer Toolkit Platform
 * Types definition file
 */

export type ActiveTab =
  | "landing"
  | "dashboard"
  | "text-gen"
  | "summarize"
  | "grammar"
  | "explainer"
  | "pdf-qa"
  | "image-gen"
  | "sessions"
  | "api-keys"
  | "api-docs"
  | "usage"
  | "settings"
  | "admin"
  | "auth"
  | "prompts"
  | "knowledge-bases"
  | "workflows"
  | "workspaces"
  | "agents";

export interface ApiKeyRecord {
  id: string;
  key: string;
  createdAt: string;
  status: "active" | "revoked";
  hits: number;
  lastUsed: string;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  apiKey: string;
  createdAt: string;
  status: "active" | "disabled";
  totalHits: number;
  totalTokens: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  provider?: "google" | "github" | "email_password";
  avatarUrl?: string;
  apiKey: string;
  customGeminiKey?: string;
  createdAt: string;
  googleConnected?: boolean;
  githubConnected?: boolean;
}

export interface SavedSession {
  id: string;
  userId: string;
  title: string;
  tool: "Text Generator" | "Summarizer" | "Image Generator" | "Grammar Improver" | "PDF Q&A" | "Code Explainer";
  prompt: string;
  response: string;
  config?: any;
  workspaceId?: string;
  createdAt: string;
}

export interface StoredDocument {
  id: string;
  userId: string;
  name: string;
  textLength: number;
  snippet: string;
  workspaceId?: string;
  uploadedAt: string;
}

export interface StoredImage {
  id: string;
  userId: string;
  prompt: string;
  svgCode: string;
  designAnalysis?: string;
  palette?: string[];
  workspaceId?: string;
  createdAt: string;
}

export interface UsageRecord {
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

// Config structures for individual tools

export interface TextGenConfig {
  prompt: string;
  systemInstruction: string;
  temperature: number;
  topP: number;
}

export interface SummarizeConfig {
  text: string;
  style: "bullets" | "executive-summary" | "compact-one-liner" | "paragraph";
  length: "short" | "medium" | "long";
}

export interface GrammarConfig {
  text: string;
  tone: "professional" | "casual" | "academic" | "creative" | "assertive";
}

export interface GrammarCorrection {
  original: string;
  improved: string;
  type: string;
  explanation: string;
}

export interface GrammarResult {
  polishedText: string;
  changes: GrammarCorrection[];
  readabilityScore: string;
  toneAnalysis: string;
}

export interface CodeExplainerConfig {
  code: string;
  language: string;
  depth: "high-level" | "deep-dive" | "educational" | "line-by-line";
}

export interface CodeIssue {
  severity: "High" | "Medium" | "Low" | "Optimization";
  description: string;
  fix: string;
}

export interface CodeExplainerResult {
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  issues: CodeIssue[];
  optimizedCode: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface PdfQaConfig {
  documentText: string;
  filename: string;
  query: string;
}

export interface ImageGenConfig {
  prompt: string;
  style: string;
  aspectRatio: "1:1" | "16:9" | "9:16" | "4:3";
}

export interface ImageGenResult {
  svgCode: string;
  designAnalysis: string;
  palette: string[];
}

export interface PromptTemplate {
  id: string;
  userId: string;
  title: string;
  category: string;
  content: string;
  favorite: boolean;
  version: number;
  workspaceId?: string;
  createdAt: string;
}

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description: string;
  documents: StoredDocument[];
  workspaceId?: string;
  createdAt: string;
}

export type WorkflowNodeType =
  | "input"
  | "prompt"
  | "llm"
  | "summarize"
  | "grammar"
  | "explainer"
  | "image-gen"
  | "pdf-search"
  | "output";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: any;
  status?: "idle" | "running" | "success" | "error";
  output?: string;
  x: number;
  y: number;
}

export interface WorkflowConnection {
  fromNodeId: string;
  toNodeId: string;
}

export interface SavedWorkflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  workspaceId?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface CustomAgent {
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


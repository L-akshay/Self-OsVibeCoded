export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  INBOX = 'INBOX',
  KNOWLEDGE_GRAPH = 'KNOWLEDGE_GRAPH',
  TASKBOARD = 'TASKBOARD',
  AI_CONSOLE = 'AI_CONSOLE',
  LIVE_SESSION = 'LIVE_SESSION',
  SETTINGS = 'SETTINGS',
  AVATAR_STUDIO = 'AVATAR_STUDIO',
  STRATEGY_MAP = 'STRATEGY_MAP',
  WORKFLOWS = 'WORKFLOWS'
}

export enum AgentType {
  EXTRACTOR = 'EXTRACTOR',
  PLANNER = 'PLANNER',
  REFLECTOR = 'REFLECTOR',
  CHAT = 'CHAT'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // In a real app, this would be hashed on server. Stored locally for simulation.
  avatarUrl: string | null;
  xp: number;
  level: number;
  createdAt: number;
}

export interface AiIdentity {
  name: string;
  avatarUrl: string | null;
  personality?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'INBOX' | 'TODAY' | 'NEXT' | 'BACKLOG' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  userId?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'TOPIC' | 'PERSON' | 'CONTENT' | 'HABIT';
  val: number; // For visualization sizing
  description?: string; // Context for the memory
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'audio' | 'plan' | 'reflection';
  thinking?: string; // For thinking mode trace
  groundingUrls?: string[]; // For search results
  imageUrl?: string;
}

export interface MemoryUnit {
  id: string;
  content: string;
  date: string;
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PlanRecommendation {
  actions: string[];
  schedule: { time: string; task: string }[];
  total_minutes: number;
}

export const APP_NAME = "SELF-OS";

export const AGENT_PROMPTS = {
  EXTRACTOR: `You are the Extractor Agent for SELF-OS. Your job is to analyze the input (text or image description) and extract structured data.
  Identify tasks, key concepts for the knowledge graph, and emotional sentiment.
  Return JSON only.`,
  
  PLANNER: `You are the Planner Agent. Use the provided context to build a daily schedule. 
  You MUST use Search Grounding if the user asks about current events or specific location data to ensure the plan is feasible.
  Format output as a JSON schedule.`,
  
  REFLECTOR: `You are the Reflector Agent. Look at the user's recent memory stream and identify patterns, habits, and areas for improvement. Be empathetic but analytical.`
};

export const MOCK_GRAPH_DATA = {
  nodes: [
    { id: 'productivity', label: 'Deep Work', type: 'TOPIC', val: 12, description: "Your core focus state. We've linked this to morning routines and noise-canceling playlists." },
    { id: 'react', label: 'Creative Coding', type: 'TOPIC', val: 8, description: "The intersection of art and logic. You asked me to remind you to 'play' with code more often." },
    { id: 'gemini', label: 'AI Ethics', type: 'TOPIC', val: 10, description: "A recurring theme in our late-night chats. You're concerned about agency and alignment." },
    { id: 'fitness', label: 'Morning Run', type: 'HABIT', val: 6, description: "The foundation of your energy levels. Consistency has been at 80% this week." },
    { id: 'alice', label: 'Alice (Partner)', type: 'PERSON', val: 7, description: "Your primary collaborator. I track project ideas and meeting notes shared with her." },
    { id: 'launch', label: 'Product Launch', type: 'CONTENT', val: 5, description: "The big goal for Q3. Linked to several tasks and strategy maps." },
  ] as any[],
  links: [
    { source: 'productivity', target: 'gemini' },
    { source: 'react', target: 'gemini' },
    { source: 'productivity', target: 'fitness' },
    { source: 'alice', target: 'launch' },
    { source: 'launch', target: 'productivity' },
    { source: 'react', target: 'launch' },
  ] as any[]
};

export const MOCK_TASKS = [
  { id: 't1', title: 'Review Gemini 2.5 Docs', status: 'INBOX', priority: 'HIGH', tags: ['Research', 'AI'] },
  { id: 't2', title: 'Optimize Graph Rendering', status: 'TODAY', priority: 'MEDIUM', tags: ['Dev', 'UI'] },
  { id: 't3', title: 'Weekly Reflection', status: 'NEXT', priority: 'LOW', tags: ['Habit'] },
  { id: 't4', title: 'Update System Prompts', status: 'BACKLOG', priority: 'MEDIUM', tags: ['Config'] },
  { id: 't5', title: 'Setup Project Structure', status: 'DONE', priority: 'HIGH', tags: ['Setup'] },
];
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
    { id: 'productivity', label: 'Productivity', type: 'TOPIC', val: 10 },
    { id: 'react', label: 'React.js', type: 'TOPIC', val: 8 },
    { id: 'gemini', label: 'Gemini API', type: 'TOPIC', val: 12 },
    { id: 'fitness', label: 'Fitness', type: 'HABIT', val: 6 },
    { id: 'alice', label: 'Alice', type: 'PERSON', val: 5 },
    { id: 'meeting', label: 'Strategy Meeting', type: 'CONTENT', val: 4 },
  ] as any[],
  links: [
    { source: 'productivity', target: 'gemini' },
    { source: 'react', target: 'gemini' },
    { source: 'productivity', target: 'fitness' },
    { source: 'alice', target: 'meeting' },
    { source: 'meeting', target: 'productivity' },
  ] as any[]
};

export const MOCK_TASKS = [
  { id: 't1', title: 'Review Gemini 2.5 Docs', status: 'INBOX', priority: 'HIGH', tags: ['Research', 'AI'] },
  { id: 't2', title: 'Optimize Graph Rendering', status: 'TODAY', priority: 'MEDIUM', tags: ['Dev', 'UI'] },
  { id: 't3', title: 'Weekly Reflection', status: 'NEXT', priority: 'LOW', tags: ['Habit'] },
  { id: 't4', title: 'Update System Prompts', status: 'BACKLOG', priority: 'MEDIUM', tags: ['Config'] },
  { id: 't5', title: 'Setup Project Structure', status: 'DONE', priority: 'HIGH', tags: ['Setup'] },
];
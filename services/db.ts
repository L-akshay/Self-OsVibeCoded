import { User, Task, Message, GraphNode, GraphLink } from '../types';
import { MOCK_TASKS, MOCK_GRAPH_DATA } from '../constants';

class DatabaseService {
  private USERS_KEY = 'SELF_OS_USERS_V1';
  private SESSION_KEY = 'SELF_OS_SESSION_V1';
  private DATA_PREFIX = 'SELF_OS_DATA_';

  // --- Auth Methods ---

  getUsers(): User[] {
    const usersStr = localStorage.getItem(this.USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  saveUser(user: User) {
    const users = this.getUsers().filter(u => u.id !== user.id);
    users.push(user);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    this.updateSession(user);
  }

  register(email: string, password: string, name: string): User {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      throw new Error("User already exists");
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      password, // Note: In production, never store plain text passwords
      avatarUrl: null,
      xp: 0,
      level: 1,
      createdAt: Date.now()
    };

    this.saveUser(newUser);
    this.seedUserData(newUser.id); // Initialize default data for new user
    return newUser;
  }

  login(email: string, password: string): User {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error("Invalid credentials");
    }
    this.updateSession(user);
    return user;
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  }

  getCurrentUser(): User | null {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }

  private updateSession(user: User) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  }

  // --- Data Methods ---

  // Initialize a new user with the mock data structure
  private seedUserData(userId: string) {
    this.saveTasks(userId, MOCK_TASKS.map(t => ({...t, userId} as Task)));
    // Seed generic chat greeting
    this.saveChats(userId, [{ 
      id: '1', 
      role: 'model', 
      content: `Hello ${this.getCurrentUser()?.name || 'Explorer'}. I am SELF-OS. I'm ready to think, plan, and create with you.`, 
      timestamp: Date.now() 
    }]);
    // Can also seed graph data if we make graph dynamic per user
  }

  // Tasks
  getTasks(userId: string): Task[] {
    const data = localStorage.getItem(`${this.DATA_PREFIX}TASKS_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  saveTasks(userId: string, tasks: Task[]) {
    localStorage.setItem(`${this.DATA_PREFIX}TASKS_${userId}`, JSON.stringify(tasks));
  }

  addTask(userId: string, task: Task) {
    const tasks = this.getTasks(userId);
    tasks.unshift(task);
    this.saveTasks(userId, tasks);
  }

  updateTask(userId: string, task: Task) {
    const tasks = this.getTasks(userId);
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
      this.saveTasks(userId, tasks);
    }
  }

  // Chats
  getChats(userId: string): Message[] {
    const data = localStorage.getItem(`${this.DATA_PREFIX}CHATS_${userId}`);
    return data ? JSON.parse(data) : [];
  }

  saveChats(userId: string, messages: Message[]) {
    localStorage.setItem(`${this.DATA_PREFIX}CHATS_${userId}`, JSON.stringify(messages));
  }

  addMessage(userId: string, message: Message) {
    const chats = this.getChats(userId);
    chats.push(message);
    this.saveChats(userId, chats);
  }

  // User Profile
  updateUserProfile(userId: string, updates: Partial<User>) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const updatedUser = { ...users[idx], ...updates };
      users[idx] = updatedUser;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      
      // Update session if it's current user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.updateSession(updatedUser);
      }
    }
  }
}

export const db = new DatabaseService();
import { users, blockedSites, timerSettings, sessions } from "@shared/schema";
import type { User, InsertUser, BlockedSite, InsertBlockedSite, TimerSetting, InsertTimerSetting, Session, InsertSession, UpdateSession } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blocked sites methods
  getBlockedSites(userId: number): Promise<BlockedSite[]>;
  addBlockedSite(site: InsertBlockedSite): Promise<BlockedSite>;
  removeBlockedSite(id: number, userId: number): Promise<boolean>;
  
  // Timer settings methods
  getTimerSettings(userId: number): Promise<TimerSetting | undefined>;
  createTimerSettings(settings: InsertTimerSetting): Promise<TimerSetting>;
  updateTimerSettings(userId: number, settings: Partial<InsertTimerSetting>): Promise<TimerSetting>;
  
  // Session methods
  getSessions(userId: number): Promise<Session[]>;
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<UpdateSession>): Promise<Session>;
  getSessionStats(userId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalFocusTime: number; // in seconds
    dailyFocusTime: Record<string, number>; // date -> seconds
    weeklyFocusTime: number[]; // array of seconds for each day of the week
  }>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blockedSites: Map<number, BlockedSite>;
  private timerSettings: Map<number, TimerSetting>;
  private sessions: Map<number, Session>;
  sessionStore: session.SessionStore;
  private userIdCounter: number;
  private blockedSiteIdCounter: number;
  private timerSettingsIdCounter: number;
  private sessionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.blockedSites = new Map();
    this.timerSettings = new Map();
    this.sessions = new Map();
    this.userIdCounter = 1;
    this.blockedSiteIdCounter = 1;
    this.timerSettingsIdCounter = 1;
    this.sessionIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Blocked sites methods
  async getBlockedSites(userId: number): Promise<BlockedSite[]> {
    return Array.from(this.blockedSites.values()).filter(
      (site) => site.userId === userId
    );
  }

  async addBlockedSite(site: InsertBlockedSite): Promise<BlockedSite> {
    const id = this.blockedSiteIdCounter++;
    const now = new Date();
    const newSite: BlockedSite = { ...site, id, createdAt: now };
    this.blockedSites.set(id, newSite);
    return newSite;
  }

  async removeBlockedSite(id: number, userId: number): Promise<boolean> {
    const site = this.blockedSites.get(id);
    if (site && site.userId === userId) {
      this.blockedSites.delete(id);
      return true;
    }
    return false;
  }

  // Timer settings methods
  async getTimerSettings(userId: number): Promise<TimerSetting | undefined> {
    return Array.from(this.timerSettings.values()).find(
      (settings) => settings.userId === userId
    );
  }

  async createTimerSettings(settings: InsertTimerSetting): Promise<TimerSetting> {
    const id = this.timerSettingsIdCounter++;
    const now = new Date();
    const newSettings: TimerSetting = { ...settings, id, updatedAt: now };
    this.timerSettings.set(id, newSettings);
    return newSettings;
  }

  async updateTimerSettings(userId: number, settings: Partial<InsertTimerSetting>): Promise<TimerSetting> {
    let userSettings = await this.getTimerSettings(userId);
    
    if (!userSettings) {
      userSettings = await this.createTimerSettings({
        userId,
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        soundEnabled: true,
        notificationsEnabled: true,
        soundVolume: 75,
        soundType: "bell"
      });
    }
    
    const updatedSettings: TimerSetting = {
      ...userSettings,
      ...settings,
      updatedAt: new Date()
    };
    
    this.timerSettings.set(userSettings.id, updatedSettings);
    return updatedSettings;
  }

  // Session methods
  async getSessions(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => {
        // Sort by start time descending (newest first)
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
  }

  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionIdCounter++;
    const session: Session = {
      ...sessionData,
      id,
      pomodorosCompleted: 0,
      totalFocusTime: 0,
      isCompleted: false,
      isInterrupted: false
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, data: Partial<UpdateSession>): Promise<Session> {
    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session with id ${id} not found`);
    }
    
    const updatedSession: Session = {
      ...session,
      ...data
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async getSessionStats(userId: number): Promise<{
    totalSessions: number;
    completedSessions: number;
    totalFocusTime: number;
    dailyFocusTime: Record<string, number>;
    weeklyFocusTime: number[];
  }> {
    const userSessions = await this.getSessions(userId);
    
    const totalSessions = userSessions.length;
    const completedSessions = userSessions.filter(s => s.isCompleted).length;
    const totalFocusTime = userSessions.reduce((sum, s) => sum + s.totalFocusTime, 0);
    
    // Calculate daily focus time for the last 30 days
    const dailyFocusTime: Record<string, number> = {};
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const session of userSessions) {
      const sessionDate = new Date(session.startTime);
      if (sessionDate >= thirtyDaysAgo) {
        const dateStr = sessionDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (!dailyFocusTime[dateStr]) {
          dailyFocusTime[dateStr] = 0;
        }
        dailyFocusTime[dateStr] += session.totalFocusTime;
      }
    }
    
    // Calculate weekly focus time (last 7 days)
    const weeklyFocusTime: number[] = Array(7).fill(0);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    
    for (const session of userSessions) {
      const sessionDate = new Date(session.startTime);
      if (sessionDate >= sevenDaysAgo) {
        const dayDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        const dayIndex = 6 - dayDiff; // 0 = 6 days ago, 6 = today
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyFocusTime[dayIndex] += session.totalFocusTime;
        }
      }
    }
    
    return {
      totalSessions,
      completedSessions,
      totalFocusTime,
      dailyFocusTime,
      weeklyFocusTime
    };
  }
}

export const storage = new MemStorage();

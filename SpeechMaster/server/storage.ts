import { type User, type InsertUser, type Conversion, type InsertConversion } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getConversion(id: string): Promise<Conversion | undefined>;
  createConversion(conversion: InsertConversion): Promise<Conversion>;
  updateConversion(id: string, updates: Partial<Conversion>): Promise<Conversion | undefined>;
  getRecentConversions(limit?: number): Promise<Conversion[]>;
  getUserConversions(userId: string, limit?: number): Promise<Conversion[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversions: Map<string, Conversion>;

  constructor() {
    this.users = new Map();
    this.conversions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversion(id: string): Promise<Conversion | undefined> {
    return this.conversions.get(id);
  }

  async createConversion(insertConversion: InsertConversion): Promise<Conversion> {
    const id = randomUUID();
    const conversion: Conversion = {
      ...insertConversion,
      id,
      userId: null,
      audioPath: null,
      duration: null,
      fileSize: null,
      segments: null,
      status: "pending",
      createdAt: new Date(),
      completedAt: null,
    };
    this.conversions.set(id, conversion);
    return conversion;
  }

  async updateConversion(id: string, updates: Partial<Conversion>): Promise<Conversion | undefined> {
    const existing = this.conversions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.conversions.set(id, updated);
    return updated;
  }

  async getRecentConversions(limit = 10): Promise<Conversion[]> {
    return Array.from(this.conversions.values())
      .filter(c => c.status === "completed")
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getUserConversions(userId: string, limit = 10): Promise<Conversion[]> {
    return Array.from(this.conversions.values())
      .filter(c => c.userId === userId && c.status === "completed")
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }
}

export const storage = new MemStorage();

import { users, type User, type InsertUser, type ContentItem, type InsertContent, GoogleSheetsImage } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Content item methods
  getContentItem(id: number): Promise<ContentItem | undefined>;
  getRecentContentItems(limit: number): Promise<ContentItem[]>;
  createContentItem(item: InsertContent & { generatedContent?: string, images?: GoogleSheetsImage[] }): Promise<ContentItem>;
  updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contentItems: Map<number, ContentItem>;
  currentUserId: number;
  currentContentId: number;

  constructor() {
    this.users = new Map();
    this.contentItems = new Map();
    this.currentUserId = 1;
    this.currentContentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Content item methods
  async getContentItem(id: number): Promise<ContentItem | undefined> {
    return this.contentItems.get(id);
  }
  
  async getRecentContentItems(limit: number): Promise<ContentItem[]> {
    return Array.from(this.contentItems.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  async createContentItem(item: InsertContent & { generatedContent?: string, images?: GoogleSheetsImage[] }): Promise<ContentItem> {
    const id = this.currentContentId++;
    const now = new Date();
    
    const contentItem: ContentItem = {
      ...item,
      id,
      createdAt: now,
      shopifyId: "",
      shopifyUrl: "",
      generatedContent: item.generatedContent || null,
      metadata: item.images ? { images: item.images } : {}
    };
    
    this.contentItems.set(id, contentItem);
    return contentItem;
  }
  
  async updateContentItem(id: number, updates: Partial<ContentItem>): Promise<ContentItem | undefined> {
    const existingItem = this.contentItems.get(id);
    
    if (!existingItem) return undefined;
    
    const updatedItem = {
      ...existingItem,
      ...updates
    };
    
    this.contentItems.set(id, updatedItem);
    return updatedItem;
  }
}

export const storage = new MemStorage();

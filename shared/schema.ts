import { pgTable, text, serial, integer, boolean, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Content generator types
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  numH2s: integer("num_h2s").notNull(),
  h2WordLimit: integer("h2_word_limit").notNull(),
  sectionLength: text("section_length").notNull(),
  voice: text("voice").notNull(),
  enableTables: boolean("enable_tables").notNull(),
  enableLists: boolean("enable_lists").notNull(),
  enableH3: boolean("enable_h3").notNull(),
  introType: text("intro_type").notNull(),
  faqType: text("faq_type").notNull(),
  publishType: text("publish_type").notNull(),
  imageCount: integer("image_count").notNull(),
  generatedContent: text("generated_content"),
  shopifyId: text("shopify_id"),
  shopifyUrl: text("shopify_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata")
});

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  url: string;
}

export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  url: string;
}

export const contentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  selectedProducts: z.array(z.string()).optional(),
  selectedCollections: z.array(z.string()).optional(),
  numH2s: z.coerce.number().min(1).max(10),
  h2WordLimit: z.coerce.number().min(3).max(20),
  sectionLength: z.enum(["Small", "Medium", "Large"]),
  voice: z.enum(["First person plural", "First person singular", "Second person", "Third person", "Professional"]),
  enableTables: z.boolean().default(false),
  enableLists: z.boolean().default(true),
  enableH3: z.boolean().default(true),
  introType: z.enum(["None", "Standard intro", "Search Intent intro"]),
  faqType: z.enum(["No FAQ", "FAQ + Short Answer", "FAQ + Long Answer"]),
  publishType: z.enum(["blog", "page", "draft"]),
  imageCount: z.coerce.number().min(1).max(4),
  googleSheetId: z.string().optional().or(z.literal('')),
  category: z.string().optional(),
  enableInternalLinks: z.boolean().default(true)
});

export const insertContentSchema = createInsertSchema(contentItems).omit({
  id: true,
  generatedContent: true,
  shopifyId: true,
  shopifyUrl: true,
  createdAt: true,
  metadata: true
});

export type ContentForm = z.infer<typeof contentFormSchema>;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

// API response types for generated content
export interface GeneratedContentResponse {
  content: string;
  metadata?: {
    wordCount?: number;
    seoScore?: number;
    keywords?: string[];
  };
}

export interface ShopifyPublishResponse {
  id: string;
  url: string;
  title: string;
  status: string;
}

export interface GoogleSheetsImage {
  url: string;
  alt: string;
  type: "main" | "secondary" | "video" | "link";
  linkText?: string;
}

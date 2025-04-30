import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { contentFormSchema, type ContentForm } from "@shared/schema";
import { generateContent } from "./services/openai";
import { fetchImagesFromGoogleSheets } from "./services/googleSheets";
import { publishToShopify } from "./services/shopify";

export async function registerRoutes(app: Express): Promise<Server> {
  // Fetch Shopify products and collections
  app.get("/api/shopify/products", async (req, res) => {
    const products = await fetchShopifyProducts();
    res.json({ success: true, products });
  });

  app.get("/api/shopify/collections", async (req, res) => {
    const collections = await fetchShopifyCollections();
    res.json({ success: true, collections });
  });
  // API routes for content generation process
  app.post("/api/generate-content", async (req, res) => {
    try {
      // Validate input with Zod schema
      const validatedData = contentFormSchema.parse(req.body);
      
      // 1. Generate content with OpenAI
      const { content, metadata } = await generateContent(validatedData);
      
      // 2. Fetch images from Google Sheets with custom sheet options
      const images = await fetchImagesFromGoogleSheets({
        imageCount: validatedData.imageCount,
        googleSheetId: validatedData.googleSheetId,
        category: validatedData.category,
        enableInternalLinks: validatedData.enableInternalLinks
      });
      
      // Store content in memory
      const contentItem = await storage.createContentItem({
        ...validatedData,
        generatedContent: content,
        images
      });
      
      // Return content immediately without publishing if draft
      if (validatedData.publishType === "draft") {
        return res.json({
          success: true,
          contentId: contentItem.id,
          content,
          images,
          metadata
        });
      }
      
      // 3. Publish to Shopify if not draft
      const publishResult = await publishToShopify({
        title: validatedData.title,
        content,
        images,
        publishType: validatedData.publishType
      });
      
      // Update storage with Shopify results
      await storage.updateContentItem(contentItem.id, {
        shopifyId: publishResult.id,
        shopifyUrl: publishResult.url
      });
      
      // Return complete response
      return res.json({
        success: true,
        contentId: contentItem.id,
        content,
        images,
        metadata,
        shopify: publishResult
      });
    } catch (error) {
      console.error("Content generation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate content"
      });
    }
  });
  
  // Get recent content items
  app.get("/api/recent-content", async (req, res) => {
    try {
      const recentContent = await storage.getRecentContentItems(5);
      return res.json({
        success: true,
        items: recentContent
      });
    } catch (error) {
      console.error("Error fetching recent content:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch recent content"
      });
    }
  });
  
  // Check API connections
  app.get("/api/check-connections", async (req, res) => {
    try {
      // Check if each API is configured and can be connected to
      const openaiStatus = process.env.OPENAI_API_KEY ? "connected" : "missing";
      const googleSheetStatus = process.env.GOOGLE_API_KEY ? "connected" : "missing";
      const shopifyStatus = process.env.SHOPIFY_DOMAIN && process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_API_PASSWORD ? "connected" : "missing";
      
      return res.json({
        success: true,
        connections: {
          openai: openaiStatus,
          googleSheets: googleSheetStatus,
          shopify: shopifyStatus
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to check connections",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

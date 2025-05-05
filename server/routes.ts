import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBlockedSiteSchema, insertSessionSchema, updateSessionSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Blocked sites routes
  app.get("/api/blocked-sites", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sites = await storage.getBlockedSites(req.user.id);
      res.json(sites);
    } catch (error) {
      console.error("Error getting blocked sites:", error);
      res.status(500).json({ message: "Failed to get blocked sites" });
    }
  });

  app.post("/api/blocked-sites", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const siteData = { ...req.body, userId: req.user.id };
      const validatedData = insertBlockedSiteSchema.parse(siteData);
      const site = await storage.addBlockedSite(validatedData);
      res.status(201).json(site);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error adding blocked site:", error);
      res.status(500).json({ message: "Failed to add blocked site" });
    }
  });

  app.delete("/api/blocked-sites/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const siteId = parseInt(req.params.id);
      if (isNaN(siteId)) {
        return res.status(400).json({ message: "Invalid site ID" });
      }
      
      const success = await storage.removeBlockedSite(siteId, req.user.id);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Site not found or you don't have permission to delete it" });
      }
    } catch (error) {
      console.error("Error removing blocked site:", error);
      res.status(500).json({ message: "Failed to remove blocked site" });
    }
  });

  // Timer settings routes
  app.get("/api/timer-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      let settings = await storage.getTimerSettings(req.user.id);
      if (!settings) {
        // Create default settings
        settings = await storage.createTimerSettings({
          userId: req.user.id,
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
      res.json(settings);
    } catch (error) {
      console.error("Error getting timer settings:", error);
      res.status(500).json({ message: "Failed to get timer settings" });
    }
  });

  app.put("/api/timer-settings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const updatedSettings = await storage.updateTimerSettings(req.user.id, req.body);
      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating timer settings:", error);
      res.status(500).json({ message: "Failed to update timer settings" });
    }
  });

  // Session routes
  app.get("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const sessions = await storage.getSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error getting sessions:", error);
      res.status(500).json({ message: "Failed to get sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Session data received:", req.body);
      const sessionData = { ...req.body, userId: req.user.id };
      console.log("Session data with userId:", sessionData);
      
      const validatedData = insertSessionSchema.parse(sessionData);
      console.log("Validated session data:", validatedData);
      
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Zod validation error:", error.errors);
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      console.log("Update session data received:", req.body);
      
      const sessionId = parseInt(req.params.id);
      if (isNaN(sessionId)) {
        return res.status(400).json({ message: "Invalid session ID" });
      }
      
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to update this session" });
      }
      
      const validatedData = updateSessionSchema.partial().parse(req.body);
      console.log("Validated update data:", validatedData);
      
      const updatedSession = await storage.updateSession(sessionId, validatedData);
      res.json(updatedSession);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Zod validation error:", error.errors);
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.get("/api/sessions/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const stats = await storage.getSessionStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting session stats:", error);
      res.status(500).json({ message: "Failed to get session stats" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

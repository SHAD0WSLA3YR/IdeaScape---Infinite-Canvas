import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as collaboration from "./collaboration.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-832115ea/health", (c) => {
  return c.json({ status: "ok" });
});

// ========== COLLABORATION ROUTES ==========

// Create a new collaborative canvas
app.post("/make-server-832115ea/canvas/create", async (c) => {
  try {
    const body = await c.req.json();
    const { name, data, userId } = body;

    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const canvasId = await collaboration.createCollaborativeCanvas(name, data, userId);
    
    // Generate full URL for sharing
    const requestUrl = new URL(c.req.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const shareUrl = `${baseUrl}/canvas/${canvasId}`;
    
    return c.json({ 
      success: true, 
      canvasId,
      shareUrl
    });
  } catch (error) {
    console.error("❌ Error creating collaborative canvas:", error);
    return c.json({ error: "Failed to create canvas" }, 500);
  }
});

// Join an existing collaborative canvas
app.post("/make-server-832115ea/canvas/:canvasId/join", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const body = await c.req.json();
    const { userId, userName } = body;

    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const result = await collaboration.joinCollaborativeCanvas(canvasId, userId, userName);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ 
      success: true, 
      canvas: result.canvas 
    });
  } catch (error) {
    console.error("❌ Error joining canvas:", error);
    return c.json({ error: "Failed to join canvas" }, 500);
  }
});

// Get canvas data
app.get("/make-server-832115ea/canvas/:canvasId", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const canvas = await kv.get(`collaborative_canvas:${canvasId}`);
    
    if (!canvas) {
      return c.json({ error: "Canvas not found" }, 404);
    }

    return c.json({ success: true, canvas });
  } catch (error) {
    console.error("❌ Error getting canvas:", error);
    return c.json({ error: "Failed to get canvas" }, 500);
  }
});

// Update canvas data
app.put("/make-server-832115ea/canvas/:canvasId", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const body = await c.req.json();
    const { data, userId } = body;

    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const result = await collaboration.updateCanvasData(canvasId, data, userId);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating canvas:", error);
    return c.json({ error: "Failed to update canvas" }, 500);
  }
});

// Update user presence
app.put("/make-server-832115ea/canvas/:canvasId/presence", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const body = await c.req.json();
    const { userId, presence } = body;

    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const result = await collaboration.updateUserPresence(canvasId, userId, presence);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error updating presence:", error);
    return c.json({ error: "Failed to update presence" }, 500);
  }
});

// Get canvas participants
app.get("/make-server-832115ea/canvas/:canvasId/participants", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const participants = await collaboration.getCanvasParticipants(canvasId);
    
    return c.json({ success: true, participants });
  } catch (error) {
    console.error("❌ Error getting participants:", error);
    return c.json({ error: "Failed to get participants" }, 500);
  }
});

// Leave canvas
app.post("/make-server-832115ea/canvas/:canvasId/leave", async (c) => {
  try {
    const canvasId = c.req.param("canvasId");
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const result = await collaboration.leaveCanvas(canvasId, userId);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("❌ Error leaving canvas:", error);
    return c.json({ error: "Failed to leave canvas" }, 500);
  }
});

Deno.serve(app.fetch);
import { createClient } from "npm:@supabase/supabase-js@2.39.0";
import * as kv from "./kv_store.tsx";

// Initialize Supabase client for real-time features
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

interface CollaborativeCanvas {
  id: string;
  name: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  participants: string[];
  maxParticipants: number;
}

interface UserPresence {
  userId: string;
  userName: string;
  cursor?: { x: number; y: number };
  lastSeen: string;
  color: string;
}

// Generate unique canvas ID
export function generateCanvasId(): string {
  return `canvas_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate unique user ID
export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Create a new collaborative canvas
export async function createCollaborativeCanvas(name: string, initialData: any, creatorId: string): Promise<string> {
  const canvasId = generateCanvasId();
  
  const canvas: CollaborativeCanvas = {
    id: canvasId,
    name: name || 'Untitled Canvas',
    data: initialData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [creatorId],
    maxParticipants: 2
  };

  // Store canvas data in KV store
  await kv.set(`collaborative_canvas:${canvasId}`, canvas);
  
  // Store user presence
  const userPresence: UserPresence = {
    userId: creatorId,
    userName: 'User 1',
    lastSeen: new Date().toISOString(),
    color: '#3B82F6' // Blue for first user
  };
  
  await kv.set(`presence:${canvasId}:${creatorId}`, userPresence);
  
  console.log(`✅ Created collaborative canvas: ${canvasId}`);
  return canvasId;
}

// Join an existing collaborative canvas
export async function joinCollaborativeCanvas(canvasId: string, userId: string, userName?: string): Promise<{ success: boolean; canvas?: CollaborativeCanvas; error?: string }> {
  try {
    // Get canvas data
    const canvas = await kv.get(`collaborative_canvas:${canvasId}`) as CollaborativeCanvas;
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }

    // Check if canvas is full
    if (canvas.participants.length >= canvas.maxParticipants && !canvas.participants.includes(userId)) {
      return { success: false, error: 'Canvas is full (maximum 2 participants)' };
    }

    // Add user to participants if not already present
    if (!canvas.participants.includes(userId)) {
      canvas.participants.push(userId);
      canvas.updatedAt = new Date().toISOString();
      await kv.set(`collaborative_canvas:${canvasId}`, canvas);
    }

    // Set user presence
    const userPresence: UserPresence = {
      userId,
      userName: userName || `User ${canvas.participants.indexOf(userId) + 1}`,
      lastSeen: new Date().toISOString(),
      color: canvas.participants.indexOf(userId) === 0 ? '#3B82F6' : '#EF4444' // Blue for first, red for second
    };
    
    await kv.set(`presence:${canvasId}:${userId}`, userPresence);
    
    console.log(`✅ User ${userId} joined canvas: ${canvasId}`);
    return { success: true, canvas };
  } catch (error) {
    console.error('❌ Error joining canvas:', error);
    return { success: false, error: 'Failed to join canvas' };
  }
}

// Update canvas data
export async function updateCanvasData(canvasId: string, data: any, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const canvas = await kv.get(`collaborative_canvas:${canvasId}`) as CollaborativeCanvas;
    
    if (!canvas) {
      return { success: false, error: 'Canvas not found' };
    }

    if (!canvas.participants.includes(userId)) {
      return { success: false, error: 'User not authorized to edit this canvas' };
    }

    // Update canvas data
    canvas.data = data;
    canvas.updatedAt = new Date().toISOString();
    await kv.set(`collaborative_canvas:${canvasId}`, canvas);

    // Broadcast update through Supabase realtime
    await broadcastCanvasUpdate(canvasId, data, userId);
    
    console.log(`✅ Canvas ${canvasId} updated by user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating canvas:', error);
    return { success: false, error: 'Failed to update canvas' };
  }
}

// Update user presence (cursor position, etc.)
export async function updateUserPresence(canvasId: string, userId: string, presence: Partial<UserPresence>): Promise<{ success: boolean; error?: string }> {
  try {
    const existingPresence = await kv.get(`presence:${canvasId}:${userId}`) as UserPresence;
    
    if (!existingPresence) {
      return { success: false, error: 'User presence not found' };
    }

    const updatedPresence: UserPresence = {
      ...existingPresence,
      ...presence,
      lastSeen: new Date().toISOString()
    };

    await kv.set(`presence:${canvasId}:${userId}`, updatedPresence);

    // Broadcast presence update
    await broadcastPresenceUpdate(canvasId, updatedPresence);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating presence:', error);
    return { success: false, error: 'Failed to update presence' };
  }
}

// Get all active users for a canvas
export async function getCanvasParticipants(canvasId: string): Promise<UserPresence[]> {
  try {
    const canvas = await kv.get(`collaborative_canvas:${canvasId}`) as CollaborativeCanvas;
    
    if (!canvas) {
      return [];
    }

    const participants: UserPresence[] = [];
    
    for (const userId of canvas.participants) {
      const presence = await kv.get(`presence:${canvasId}:${userId}`) as UserPresence;
      if (presence) {
        // Check if user was active in the last 5 minutes
        const lastSeen = new Date(presence.lastSeen);
        const now = new Date();
        const timeDiff = now.getTime() - lastSeen.getTime();
        
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
          participants.push(presence);
        }
      }
    }

    return participants;
  } catch (error) {
    console.error('❌ Error getting participants:', error);
    return [];
  }
}

// Leave canvas
export async function leaveCanvas(canvasId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Remove user presence
    await kv.del(`presence:${canvasId}:${userId}`);
    
    // Update canvas participants
    const canvas = await kv.get(`collaborative_canvas:${canvasId}`) as CollaborativeCanvas;
    if (canvas) {
      canvas.participants = canvas.participants.filter(id => id !== userId);
      canvas.updatedAt = new Date().toISOString();
      await kv.set(`collaborative_canvas:${canvasId}`, canvas);
    }

    // Broadcast user left
    await broadcastUserLeft(canvasId, userId);
    
    console.log(`✅ User ${userId} left canvas: ${canvasId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error leaving canvas:', error);
    return { success: false, error: 'Failed to leave canvas' };
  }
}

// Broadcast functions for real-time updates
async function broadcastCanvasUpdate(canvasId: string, data: any, userId: string) {
  try {
    await supabase
      .channel(`canvas:${canvasId}`)
      .send({
        type: 'broadcast',
        event: 'canvas_update',
        payload: {
          canvasId,
          data,
          updatedBy: userId,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('❌ Error broadcasting canvas update:', error);
  }
}

async function broadcastPresenceUpdate(canvasId: string, presence: UserPresence) {
  try {
    await supabase
      .channel(`canvas:${canvasId}`)
      .send({
        type: 'broadcast',
        event: 'presence_update',
        payload: {
          canvasId,
          presence,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('❌ Error broadcasting presence update:', error);
  }
}

async function broadcastUserLeft(canvasId: string, userId: string) {
  try {
    await supabase
      .channel(`canvas:${canvasId}`)
      .send({
        type: 'broadcast',
        event: 'user_left',
        payload: {
          canvasId,
          userId,
          timestamp: new Date().toISOString()
        }
      });
  } catch (error) {
    console.error('❌ Error broadcasting user left:', error);
  }
}
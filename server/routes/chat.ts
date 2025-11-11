import { Router } from 'express';
import { db } from '../db';
import { and, eq, desc, gt } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import { chatMessages, chatRooms } from '../models/chatMessage';
import { users } from '../models/user';
import { businesses } from '../models/business';
import { analyzeMessage } from '../services/ai/chatAnalysis';
import { upload } from '../middleware/upload';
import { WebSocket } from 'ws';

const router = Router();

// WebSocket connections map
const activeConnections = new Map<number, WebSocket>();

// Get or create direct message room
router.post('/direct-message', authenticateToken, async (req, res) => {
  const { businessId, recipientId } = req.body;
  const senderId = req.user.id;

  // Check if room already exists
  const existingRoom = await db.query.chatRooms.findFirst({
    where: and(
      eq(chatRooms.businessId, businessId),
      eq(chatRooms.isGroup, false),
      chatRooms.participants.some(
        (p: any) => p.userId === senderId || p.userId === recipientId
      )
    ),
  });

  if (existingRoom) {
    return res.json(existingRoom);
  }

  // Create new direct message room
  const newRoom = await db.insert(chatRooms)
    .values({
      id: `dm_${Date.now()}`,
      name: 'Direct Message',
      businessId,
      isGroup: false,
      participants: [
        { userId: senderId, joinedAt: new Date().toISOString(), isAdmin: true },
        { userId: recipientId, joinedAt: new Date().toISOString(), isAdmin: true },
      ],
    })
    .returning()
    .then(rows => rows[0]);

  res.json(newRoom);
});

// Get chat history
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { cursor, limit = 50 } = req.query;

  const messages = await db.query.chatMessages.findMany({
    where: and(
      eq(chatMessages.roomId, roomId),
      cursor ? gt(chatMessages.id, Number(cursor)) : undefined,
      eq(chatMessages.isDeleted, false)
    ),
    orderBy: [desc(chatMessages.createdAt)],
    limit: Number(limit),
    with: {
      sender: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  res.json(messages.reverse());
});

// Send message with file upload
router.post('/:roomId/messages', 
  authenticateToken, 
  upload.array('attachments', 5),
  async (req, res) => {
    const { roomId } = req.params;
    const { content, replyTo } = req.body;
    const files = req.files as Express.Multer.File[];
    const senderId = req.user.id;

    // Get business ID from room
    const room = await db.query.chatRooms.findFirst({
      where: eq(chatRooms.id, roomId),
    });

    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Process attachments
    const attachments = files?.map(file => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
    })) || [];

    // Analyze message with AI
    const aiAnalysis = await analyzeMessage({
      content,
      attachments,
      senderId,
      roomId,
    });

    // Save message
    const message = await db.insert(chatMessages)
      .values({
        roomId,
        senderId,
        businessId: room.businessId,
        content,
        attachments,
        metadata: {
          aiAnalysis,
          readBy: [senderId],
        },
      })
      .returning()
      .then(rows => rows[0]);

    // Update room's last message timestamp
    await db.update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    // Broadcast to WebSocket connections
    broadcastToRoom(roomId, {
      type: 'new_message',
      data: {
        ...message,
        sender: req.user,
      },
    });

    res.json(message);
  }
);

// Mark messages as read
router.post('/:roomId/read', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  await db.update(chatMessages)
    .set({
      metadata: {
        readBy: [userId],
      },
    })
    .where(
      and(
        eq(chatMessages.roomId, roomId),
        eq(chatMessages.senderId, userId),
      )
    );

  res.json({ success: true });
});

// WebSocket connection handler
export function handleWebSocketConnection(ws: WebSocket, userId: number) {
  activeConnections.set(userId, ws);

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join_room':
          // Handle room joining logic
          break;
        case 'typing':
          // Broadcast typing indicator
          broadcastToRoom(message.roomId, {
            type: 'user_typing',
            userId,
            roomId: message.roomId,
          });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    activeConnections.delete(userId);
  });
}

// Helper function to broadcast to all users in a room
function broadcastToRoom(roomId: string, message: any) {
  const messageString = JSON.stringify(message);
  
  // In a real app, you'd get the list of user IDs in the room from the database
  activeConnections.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageString);
    }
  });
}

export default router;

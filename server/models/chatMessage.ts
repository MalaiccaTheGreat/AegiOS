import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './user';
import { businesses } from './business';

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  roomId: text('room_id').notNull(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  businessId: integer('business_id').references(() => businesses.id).notNull(),
  content: text('content').notNull(),
  attachments: jsonb('attachments').$type<Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>>().default([]),
  metadata: jsonb('metadata').$type<{
    aiAnalysis?: {
      sentiment: 'positive' | 'neutral' | 'negative';
      keyPoints?: string[];
      suggestedResponses?: string[];
    };
    readBy?: number[];
  }>().default({}),
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatRooms = pgTable('chat_rooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  businessId: integer('business_id').references(() => businesses.id).notNull(),
  participants: jsonb('participants').$type<Array<{
    userId: number;
    joinedAt: string;
    isAdmin: boolean;
  }>>().notNull(),
  isGroup: boolean('is_group').default(false),
  lastMessageAt: timestamp('last_message_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;

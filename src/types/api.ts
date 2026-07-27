import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().or(z.string()),
  role: z.string().optional(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export const courseSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  name: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  modules_count: z.number().optional(),
  lessons_count: z.number().optional(),
  completed_lessons_count: z.number().optional(),
  progress_percentage: z.number().optional(),
  teacher: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});

export const bibleVersionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().optional(),
  abbreviation: z.string().optional(),
});

export const bibleBookSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string(),
});

export const chatMessageSchema = z.object({
  id: z.number(),
  body: z.string(),
  created_at: z.string().nullable().optional(),
  user: userSchema.optional(),
});

export const chatConversationSchema = z.object({
  id: z.number(),
  type: z.string(),
  title: z.string(),
  participants: z.array(userSchema).optional(),
  last_message: chatMessageSchema.nullable().optional(),
  messages: z.array(chatMessageSchema).optional(),
});

export const meetingSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  meeting_type: z.string().nullable().optional(),
  scheduled_for: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  jitsi_room_url: z.string().nullable().optional(),
  teacher: userSchema.nullable().optional(),
  attendees: z.array(userSchema).optional(),
});

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  message: z.string(),
  url: z.string().nullable().optional(),
  read_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const notificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
  unread_count: z.number(),
});

export type ApiUser = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type BibleVersion = z.infer<typeof bibleVersionSchema>;
export type BibleBook = z.infer<typeof bibleBookSchema>;
export type ChatConversation = z.infer<typeof chatConversationSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;

export function extractApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

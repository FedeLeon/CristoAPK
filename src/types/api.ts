import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().or(z.string()),
  role: z.string().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_initials: z.string().nullable().optional(),
  avatar_color: z.string().nullable().optional(),
  profile_completion_required: z.boolean().optional(),
  profile_complete: z.boolean().optional(),
  missing_profile_fields: z
    .array(
      z.object({
        field: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export const lessonAssetSchema = z.object({
  id: z.number(),
  type: z.string().nullable().optional(),
  url: z.string(),
  thumb_url: z.string().nullable().optional(),
  original_name: z.string().nullable().optional(),
  mime: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
});

export const lessonContentSchema = z.object({
  id: z.number(),
  type: z.string(),
  text_content: z.string().nullable().optional(),
  asset: lessonAssetSchema.nullable().optional(),
});

export const lessonSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  contents: z.array(lessonContentSchema).optional(),
});

export const courseModuleSchema = z.object({
  id: z.number(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  lessons: z.array(lessonSchema).optional(),
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
  modules: z.array(courseModuleSchema).optional(),
});

export const bibleVersionSchema = z.object({
  id: z.union([z.number(), z.string()]),
  code: z.string().optional(),
  name: z.string().optional(),
  abbreviation: z.string().optional(),
  language: z.string().optional(),
  image_url: z.string().nullable().optional(),
});

export const bibleBookSchema = z.object({
  id: z.union([z.number(), z.string()]),
  bible_version_id: z.union([z.number(), z.string()]).optional(),
  version_code: z.string().nullable().optional(),
  name: z.string(),
  testament: z.string().nullable().optional(),
  position: z.number().optional(),
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

export const dashboardAnnouncementSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
  audience: z.string(),
  audience_label: z.string(),
  source_name: z.string(),
  image_url: z.string().nullable().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  is_read: z.boolean(),
});

export const dashboardDailyVerseSchema = z.object({
  reference: z.string(),
  text: z.string(),
  version: z.string(),
  book: z.object({
    id: z.number(),
    name: z.string(),
    usfm: z.string(),
  }),
  chapter: z.object({
    id: z.number(),
    number: z.number(),
  }),
});

export const dashboardResponseSchema = z.object({
  daily_verse: dashboardDailyVerseSchema.nullable().optional(),
  announcements: z.object({
    unread_count: z.number(),
    data: z.array(dashboardAnnouncementSchema),
  }),
});

export type ApiUser = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseModule = z.infer<typeof courseModuleSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;
export type BibleVersion = z.infer<typeof bibleVersionSchema>;
export type BibleBook = z.infer<typeof bibleBookSchema>;
export type ChatConversation = z.infer<typeof chatConversationSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
export type DashboardAnnouncement = z.infer<typeof dashboardAnnouncementSchema>;
export type DashboardDailyVerse = z.infer<typeof dashboardDailyVerseSchema>;

export function extractApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

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
  usfm: z.string().nullable().optional(),
  testament: z.string().nullable().optional(),
  position: z.number().optional(),
});

export const bibleVerseSchema = z.object({
  id: z.union([z.number(), z.string()]),
  number: z.number(),
  text: z.string(),
});

export const bibleChapterSchema = z.object({
  id: z.union([z.number(), z.string()]),
  number: z.number(),
  verses: z.array(bibleVerseSchema).default([]),
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
  role: z.string().nullable().optional(),
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

export const dashboardTutorMetricSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
});

export const dashboardAdminMetricSchema = z.object({
  detail: z.string().nullable().optional(),
  key: z.string(),
  label: z.string(),
  value: z.number(),
});

export const dashboardAdminAnnouncementSchema = dashboardAnnouncementSchema.extend({
  status: z.string(),
  status_label: z.string(),
});

export const dashboardResponseSchema = z.object({
  daily_verse: dashboardDailyVerseSchema.nullable().optional(),
  announcements: z.object({
    unread_count: z.number(),
    data: z.array(dashboardAnnouncementSchema),
  }),
  tutor_metrics: z.array(dashboardTutorMetricSchema).nullable().optional(),
  admin_metrics: z.array(dashboardAdminMetricSchema).nullable().optional(),
  admin_announcements: z.array(dashboardAdminAnnouncementSchema).nullable().optional(),
});

export const pastoralGuidanceVerseSchema = z.object({
  reference: z.string(),
  text: z.string(),
});

export const pastoralGuidanceResponseSchema = z.object({
  ok: z.boolean(),
  orientation: z.string().nullable().optional(),
  prayer: z.string().nullable().optional(),
  verses: z.array(pastoralGuidanceVerseSchema),
  recommend_tutor: z.boolean(),
  critical: z.boolean(),
  error: z.string().nullable().optional(),
});

export const tutorStudentSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  name: z.string(),
  email: z.string(),
  status: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_initials: z.string().nullable().optional(),
  avatar_color: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  pastoral_updated_at: z.string().nullable().optional(),
  groups: z.array(z.string()).optional(),
  pastoral_profile: z
    .object({
      has_children: z.boolean().nullable().optional(),
      children_count: z.number().nullable().optional(),
      sentimental_status: z.string().nullable().optional(),
      family_situation: z.string().nullable().optional(),
      current_challenges: z.string().nullable().optional(),
      emotional_state: z.string().nullable().optional(),
      spiritual_needs: z.string().nullable().optional(),
      prayer_requests: z.string().nullable().optional(),
      support_network: z.string().nullable().optional(),
      communication_preferences: z.string().nullable().optional(),
      care_alerts: z.string().nullable().optional(),
      next_steps: z.string().nullable().optional(),
      tutor_notes: z.string().nullable().optional(),
      pastoral_updated_at: z.string().nullable().optional(),
    })
    .optional(),
  profile: z
    .object({
      full_name: z.string().nullable().optional(),
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      birth_date: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      postal_code: z.string().nullable().optional(),
    })
    .optional(),
  progress: z
    .object({
      overall_percentage: z.number(),
      completed_lessons: z.number(),
      total_lessons: z.number(),
      courses: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          source: z.string().nullable().optional(),
          owner_name: z.string().nullable().optional(),
          completed_lessons: z.number(),
          total_lessons: z.number(),
          percentage: z.number(),
        }),
      ),
    })
    .optional(),
});

export const tutorPastoralAnalysisVerseSchema = z.object({
  reference: z.string(),
  text: z.string(),
});

export const tutorPastoralAnalysisSchema = z.object({
  process_summary: z.string(),
  recurring_topics: z.array(z.string()),
  attention_points: z.array(z.string()),
  suggested_questions: z.array(z.string()),
  suggested_next_steps: z.array(z.string()),
  recommended_verse_references: z.array(z.string()),
  verses: z.array(tutorPastoralAnalysisVerseSchema),
});

export const tutorPastoralAnalysisResponseSchema = z.object({
  ok: z.boolean(),
  insufficient_context: z.boolean(),
  error: z.string().nullable().optional(),
  analysis: tutorPastoralAnalysisSchema.nullable(),
});

export const tutorGroupSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  meeting_days: z.array(z.string()).optional(),
  meeting_time: z.string().nullable().optional(),
  modality: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  students_count: z.number().optional(),
  students: z.array(tutorStudentSchema).optional(),
});

export const tutorUsersResponseSchema = z.object({
  students: z.array(tutorStudentSchema),
  groups: z.array(tutorGroupSchema),
});

export const adminIndividualRoleSchema = z.enum(['student', 'tutor', 'pastor']);
export const adminIndividualStatusSchema = z.enum(['activo', 'bloqueado']);

export const adminIndividualSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const adminIndividualSchema = z.object({
  id: z.number(),
  name: z.string(),
  last_name: z.string().nullable().optional(),
  full_name: z.string(),
  email: z.string(),
  role: adminIndividualRoleSchema,
  role_label: z.string(),
  status: adminIndividualStatusSchema,
  status_label: z.string(),
  avatar_url: z.string().nullable().optional(),
  avatar_initials: z.string().nullable().optional(),
  avatar_color: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  registration_source_label: z.string().nullable().optional(),
  tutor: adminIndividualSummarySchema.nullable().optional(),
  students_count: z.number().optional(),
});

export const adminIndividualsResponseSchema = z.object({
  data: z.array(adminIndividualSchema),
  tabs: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
    }),
  ),
  tutors: z.array(adminIndividualSummarySchema),
});

export type ApiUser = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseModule = z.infer<typeof courseModuleSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonContent = z.infer<typeof lessonContentSchema>;
export type BibleVersion = z.infer<typeof bibleVersionSchema>;
export type BibleBook = z.infer<typeof bibleBookSchema>;
export type BibleChapter = z.infer<typeof bibleChapterSchema>;
export type BibleVerse = z.infer<typeof bibleVerseSchema>;
export type ChatConversation = z.infer<typeof chatConversationSchema>;
export type Meeting = z.infer<typeof meetingSchema>;
export type AppNotification = z.infer<typeof notificationSchema>;
export type DashboardAnnouncement = z.infer<typeof dashboardAnnouncementSchema>;
export type DashboardAdminAnnouncement = z.infer<typeof dashboardAdminAnnouncementSchema>;
export type DashboardAdminMetric = z.infer<typeof dashboardAdminMetricSchema>;
export type DashboardDailyVerse = z.infer<typeof dashboardDailyVerseSchema>;
export type DashboardTutorMetric = z.infer<typeof dashboardTutorMetricSchema>;
export type PastoralGuidanceResponse = z.infer<typeof pastoralGuidanceResponseSchema>;
export type PastoralGuidanceVerse = z.infer<typeof pastoralGuidanceVerseSchema>;
export type TutorGroup = z.infer<typeof tutorGroupSchema>;
export type TutorPastoralAnalysisResponse = z.infer<typeof tutorPastoralAnalysisResponseSchema>;
export type TutorStudent = z.infer<typeof tutorStudentSchema>;
export type TutorUsersResponse = z.infer<typeof tutorUsersResponseSchema>;
export type AdminIndividual = z.infer<typeof adminIndividualSchema>;
export type AdminIndividualRole = z.infer<typeof adminIndividualRoleSchema>;
export type AdminIndividualStatus = z.infer<typeof adminIndividualStatusSchema>;
export type AdminIndividualsResponse = z.infer<typeof adminIndividualsResponseSchema>;

export function extractApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

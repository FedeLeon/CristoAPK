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
  description: z.string().nullable().optional(),
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

export type ApiUser = z.infer<typeof userSchema>;
export type Course = z.infer<typeof courseSchema>;
export type BibleVersion = z.infer<typeof bibleVersionSchema>;
export type BibleBook = z.infer<typeof bibleBookSchema>;

export function extractApiData<T>(payload: T | { data: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

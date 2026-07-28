import axios from 'axios';
import { z } from 'zod';
import { readCache, writeCache } from '../storage/localDb';
import { extractApiData, meetingSchema, userSchema } from '../types/api';
import { api } from './client';

const meetingsResponseSchema = z.array(meetingSchema);
const meetingCandidatesResponseSchema = z.array(userSchema);

export type MeetingCreateInput = {
  description?: string;
  duration_minutes: number;
  meeting_type: 'group' | 'individual';
  participant_ids: number[];
  scheduled_for: string;
  title: string;
};

export async function getMeetings() {
  const cacheKey = 'meetings:index';

  try {
    const response = await api.get('/reuniones');
    const meetings = meetingsResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, meetings);
    return meetings;
  } catch (error) {
    const cached = await readCache<z.infer<typeof meetingsResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return meetingsResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function getMeetingCandidates() {
  const response = await api.get('/reuniones/candidatos');
  return meetingCandidatesResponseSchema.parse(extractApiData(response.data));
}

export async function createMeeting(input: MeetingCreateInput) {
  const response = await api.post('/reuniones', input);
  return meetingSchema.parse(extractApiData(response.data));
}

import axios from 'axios';
import { z } from 'zod';
import { readCache, writeCache } from '../storage/localDb';
import { extractApiData, meetingSchema } from '../types/api';
import { api } from './client';

const meetingsResponseSchema = z.array(meetingSchema);

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

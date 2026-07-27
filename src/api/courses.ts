import { z } from 'zod';
import axios from 'axios';
import { courseSchema, extractApiData } from '../types/api';
import { readCache, writeCache } from '../storage/localDb';
import { api } from './client';

const coursesResponseSchema = z.array(courseSchema);

export async function getCourses() {
  const cacheKey = 'courses:index';

  try {
    const response = await api.get('/cursos');
    const courses = coursesResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, courses);
    return courses;
  } catch (error) {
    const cached = await readCache<z.infer<typeof coursesResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return coursesResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function getCourse(id: string | number) {
  const cacheKey = `courses:show:${id}`;

  try {
    const response = await api.get(`/cursos/${id}`);
    const course = courseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, course);
    return course;
  } catch (error) {
    const cached = await readCache<z.infer<typeof courseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return courseSchema.parse(cached);
    }

    throw error;
  }
}

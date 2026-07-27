import { z } from 'zod';
import { courseSchema, extractApiData } from '../types/api';
import { api } from './client';

const coursesResponseSchema = z.array(courseSchema);

export async function getCourses() {
  const response = await api.get('/cursos');
  return coursesResponseSchema.parse(extractApiData(response.data));
}

export async function getCourse(id: string | number) {
  const response = await api.get(`/cursos/${id}`);
  return courseSchema.parse(extractApiData(response.data));
}

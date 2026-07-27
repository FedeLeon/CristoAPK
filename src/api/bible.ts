import { z } from 'zod';
import { bibleBookSchema, bibleVersionSchema, extractApiData } from '../types/api';
import { api } from './client';

const bibleVersionsResponseSchema = z.array(bibleVersionSchema);
const bibleBooksResponseSchema = z.array(bibleBookSchema);

export async function getBibleVersions() {
  const response = await api.get('/biblia/versiones');
  return bibleVersionsResponseSchema.parse(extractApiData(response.data));
}

export async function getBibleBooks() {
  const response = await api.get('/biblia/libros');
  return bibleBooksResponseSchema.parse(extractApiData(response.data));
}

export async function getBibleChapters(bookId: string | number) {
  const response = await api.get(`/biblia/capitulos/${bookId}`);
  return extractApiData(response.data);
}

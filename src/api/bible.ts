import { z } from 'zod';
import axios from 'axios';
import { bibleBookSchema, bibleChapterSchema, bibleVersionSchema, extractApiData } from '../types/api';
import { readCache, writeCache } from '../storage/localDb';
import { api } from './client';

const bibleVersionsResponseSchema = z.array(bibleVersionSchema);
const bibleBooksResponseSchema = z.array(bibleBookSchema);
const bibleChaptersResponseSchema = z.array(bibleChapterSchema);

export async function getBibleVersions() {
  const cacheKey = 'bible:versions';

  try {
    const response = await api.get('/biblia/versiones');
    const versions = bibleVersionsResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, versions);
    return versions;
  } catch (error) {
    const cached = await readCache<z.infer<typeof bibleVersionsResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return bibleVersionsResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function getBibleBooks() {
  const cacheKey = 'bible:books';

  try {
    const response = await api.get('/biblia/libros');
    const books = bibleBooksResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, books);
    return books;
  } catch (error) {
    const cached = await readCache<z.infer<typeof bibleBooksResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return bibleBooksResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function getBibleChapters(bookId: string | number) {
  const cacheKey = `bible:chapters:${bookId}`;

  try {
    const response = await api.get(`/biblia/capitulos/${bookId}`);
    const chapters = bibleChaptersResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, chapters);
    return chapters;
  } catch (error) {
    const cached = await readCache<z.infer<typeof bibleChaptersResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return bibleChaptersResponseSchema.parse(cached);
    }

    throw error;
  }
}

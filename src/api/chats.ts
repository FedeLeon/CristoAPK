import axios from 'axios';
import { z } from 'zod';
import { readCache, writeCache } from '../storage/localDb';
import { chatConversationSchema, extractApiData } from '../types/api';
import { api } from './client';

const conversationsResponseSchema = z.array(chatConversationSchema);

export async function getChats() {
  const cacheKey = 'chats:index';

  try {
    const response = await api.get('/chats');
    const conversations = conversationsResponseSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, conversations);
    return conversations;
  } catch (error) {
    const cached = await readCache<z.infer<typeof conversationsResponseSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return conversationsResponseSchema.parse(cached);
    }

    throw error;
  }
}

export async function getChat(id: string | number) {
  const cacheKey = `chats:show:${id}`;

  try {
    const response = await api.get(`/chats/${id}`);
    const conversation = chatConversationSchema.parse(extractApiData(response.data));
    await writeCache(cacheKey, conversation);
    return conversation;
  } catch (error) {
    const cached = await readCache<z.infer<typeof chatConversationSchema>>(cacheKey);

    if (cached && axios.isAxiosError(error) && !error.response) {
      return chatConversationSchema.parse(cached);
    }

    throw error;
  }
}

export async function sendChatMessage(id: string | number, body: string) {
  const response = await api.post(`/chats/${id}/mensajes`, { body });
  return extractApiData(response.data);
}

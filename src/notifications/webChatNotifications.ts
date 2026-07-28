import { Platform } from 'react-native';
import { ChatConversation } from '../types/api';

const NOTIFIED_CHAT_MESSAGE_IDS_KEY = 'notified_chat_message_ids';
const MAX_STORED_MESSAGE_IDS = 80;

function canUseBrowserNotifications() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;
}

function readNotifiedMessageIds() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return new Set<number>();
  }

  const value = window.localStorage.getItem(NOTIFIED_CHAT_MESSAGE_IDS_KEY);

  if (!value) {
    return new Set<number>();
  }

  try {
    const parsed = JSON.parse(value) as number[];

    return new Set(parsed.filter((id) => Number.isFinite(id)));
  } catch {
    return new Set<number>();
  }
}

function writeNotifiedMessageIds(ids: Set<number>) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    NOTIFIED_CHAT_MESSAGE_IDS_KEY,
    JSON.stringify([...ids].slice(-MAX_STORED_MESSAGE_IDS)),
  );
}

export async function notifyUnreadBrowserChatMessages(conversations: ChatConversation[], currentUserId?: number) {
  if (!canUseBrowserNotifications()) {
    return;
  }

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notifiedIds = readNotifiedMessageIds();
  let changed = false;

  for (const conversation of conversations) {
    const message = conversation.last_message;

    if (!message || !conversation.unread_count || message.user?.id === currentUserId || notifiedIds.has(message.id)) {
      continue;
    }

    const notification = new Notification(conversation.title || 'Nuevo mensaje', {
      body: message.user?.name ? `${message.user.name}: ${message.body}` : message.body,
      data: {
        conversationId: conversation.id,
        url: `/chat/${conversation.id}`,
      },
      tag: `chat-${conversation.id}-${message.id}`,
    });

    notification.onclick = () => {
      window.focus();
      window.location.assign(`/chat/${conversation.id}`);
    };

    notifiedIds.add(message.id);
    changed = true;
  }

  if (changed) {
    writeNotifiedMessageIds(notifiedIds);
  }
}

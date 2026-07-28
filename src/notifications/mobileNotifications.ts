import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';
import { registerPushToken, unregisterPushToken } from '../api/pushNotifications';
import { deleteSecureValue, readSecureValue, writeSecureValue } from '../storage/secureValueStorage';
import { Meeting } from '../types/api';

const REGISTERED_PUSH_TOKEN_KEY = 'registered_expo_push_token';
const SCHEDULED_MEETING_REMINDERS_KEY = 'scheduled_meeting_reminders';
const NOTIFICATION_CHANNEL_ID = 'default';

type StoredMeetingReminder = {
  id: string;
  meetingId: number;
};

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Expo Go/web or an old native build can load JS without the notifications native module.
}

export async function setupAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#12365c',
      name: 'MDS',
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch {
    // Notifications require a native build that includes expo-notifications.
  }
}

export async function registerDeviceForPushNotifications() {
  if (Platform.OS === 'web') {
    return null;
  }

  await setupAndroidNotificationChannel();

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const permission = await Notifications.requestPermissionsAsync();
      finalStatus = permission.status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      return null;
    }

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    await registerPushToken({
      expo_push_token: token,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    });
    await writeSecureValue(REGISTERED_PUSH_TOKEN_KEY, token);

    return token;
  } catch {
    return null;
  }
}

export async function unregisterDevicePushToken() {
  const token = await readSecureValue(REGISTERED_PUSH_TOKEN_KEY);

  if (!token) {
    return;
  }

  try {
    await unregisterPushToken(token);
  } finally {
    await deleteSecureValue(REGISTERED_PUSH_TOKEN_KEY);
  }
}

export function observeNotificationResponses() {
  const redirect = (notification: Notifications.Notification) => {
    const url = notification.request.content.data?.url;

    if (typeof url === 'string' && url.startsWith('/')) {
      router.push(url as Href);
    }
  };

  try {
    const lastResponse =
      typeof Notifications.getLastNotificationResponse === 'function'
        ? Notifications.getLastNotificationResponse()
        : null;

    if (lastResponse?.notification) {
      redirect(lastResponse.notification);
    }
  } catch {
    // The response API is unavailable until the native notifications module is present.
  }

  try {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification);
    });
  } catch {
    return { remove: () => undefined };
  }
}

export async function scheduleMeetingReminders(meetings: Meeting[]) {
  const currentReminders = await readScheduledMeetingReminders();

  try {
    await Promise.all(currentReminders.map((reminder) => Notifications.cancelScheduledNotificationAsync(reminder.id)));
  } catch {
    return;
  }

  const nextReminders: StoredMeetingReminder[] = [];
  const now = Date.now();

  for (const meeting of meetings) {
    if (!meeting.scheduled_for) {
      continue;
    }

    const reminderAt = new Date(meeting.scheduled_for).getTime() - 15 * 60 * 1000;

    if (reminderAt <= now) {
      continue;
    }

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          body: `Tu reunion "${meeting.title}" empieza en 15 minutos.`,
          data: {
            meeting_id: meeting.id,
            type: 'meeting_reminder',
            url: `/reuniones/${meeting.id}`,
          },
          sound: 'default',
          title: 'Recordatorio de reunion',
        },
        trigger: {
          channelId: NOTIFICATION_CHANNEL_ID,
          date: new Date(reminderAt),
          type: Notifications.SchedulableTriggerInputTypes.DATE,
        },
      });

      nextReminders.push({ id, meetingId: meeting.id });
    } catch {
      return;
    }
  }

  await writeSecureValue(SCHEDULED_MEETING_REMINDERS_KEY, JSON.stringify(nextReminders));
}

async function readScheduledMeetingReminders(): Promise<StoredMeetingReminder[]> {
  const value = await readSecureValue(SCHEDULED_MEETING_REMINDERS_KEY);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as StoredMeetingReminder[];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

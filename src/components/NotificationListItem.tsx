import {
  Bell,
  BookOpen,
  FileCheck2,
  FileText,
  FileWarning,
  HeartHandshake,
  MessageSquareText,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { AppNotification } from '../types/api';

type NotificationIconConfig = {
  color: string;
  icon: LucideIcon;
};

function iconForNotification(notification: AppNotification): NotificationIconConfig {
  const { type } = notification;

  if (type === 'TaskAssignedNotification') {
    return { color: '#2563eb', icon: FileCheck2 };
  }

  if (type === 'LessonCommentNotification') {
    return { color: '#0891b2', icon: MessageSquareText };
  }

  if (type === 'GeneralCoursePublishedNotification') {
    return { color: '#12365c', icon: BookOpen };
  }

  if (type === 'LessonContentAddedNotification') {
    return { color: '#16a34a', icon: FileText };
  }

  if (type === 'StorageWarningNotification') {
    return { color: '#d97706', icon: FileWarning };
  }

  if (type === 'CommissionStudentAddedNotification') {
    return { color: '#12365c', icon: UsersRound };
  }

  if (type === 'TutorStudentAssignedNotification') {
    return { color: '#1d4ed8', icon: UserPlus };
  }

  if (type === 'NewUserRegisteredAdminNotification') {
    if (notification.role === 'pastor') {
      return { color: '#7c3aed', icon: HeartHandshake };
    }

    return { color: '#059669', icon: UserPlus };
  }

  if (type.includes('Pastor')) {
    return { color: '#7c3aed', icon: HeartHandshake };
  }

  return { color: '#2563eb', icon: Bell };
}

export function NotificationListItem({
  compact = false,
  notification,
}: {
  compact?: boolean;
  notification: AppNotification;
}) {
  const isUnread = !notification.read_at;
  const iconConfig = iconForNotification(notification);
  const Icon = iconConfig.icon;

  return (
    <View style={[styles.item, compact && styles.itemCompact, isUnread && styles.itemUnread]}>
      <View style={[styles.iconBox, { borderColor: iconConfig.color }]}>
        <Icon color={iconConfig.color} size={compact ? 16 : 18} strokeWidth={2.1} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.message, compact && styles.messageCompact]}>{notification.message}</Text>
        {notification.created_at ? <Text style={styles.date}>{formatNotificationDate(notification.created_at)}</Text> : null}
      </View>
    </View>
  );
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 62,
    padding: 11,
  },
  itemCompact: {
    backgroundColor: '#f8fafc',
    minHeight: 54,
    padding: 10,
  },
  itemUnread: {
    backgroundColor: '#eef5fb',
    borderColor: '#c7d8ea',
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  message: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  messageCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  date: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
});

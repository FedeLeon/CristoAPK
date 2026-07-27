import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  GraduationCap,
  HeartHandshake,
  Home,
  LogIn,
  Megaphone,
  MessageCircle,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

export type ScreenTitleIcon =
  | 'announcements'
  | 'bible'
  | 'chat'
  | 'content'
  | 'home'
  | 'lesson'
  | 'login'
  | 'meetings'
  | 'notifications'
  | 'pastoral'
  | 'profile'
  | 'users';

const iconMap: Record<ScreenTitleIcon, LucideIcon> = {
  announcements: Megaphone,
  bible: BookOpen,
  chat: MessageCircle,
  content: GraduationCap,
  home: Home,
  lesson: BookOpen,
  login: LogIn,
  meetings: CalendarDays,
  notifications: Bell,
  pastoral: HeartHandshake,
  profile: CircleUserRound,
  users: UsersRound,
};

export function ScreenTitle({
  icon,
  size = 'large',
  text,
}: {
  icon: ScreenTitleIcon;
  size?: 'large' | 'medium' | 'small';
  text: string;
}) {
  const Icon = iconMap[icon];

  return (
    <View style={styles.row}>
      <View style={size === 'small' ? styles.iconSmall : styles.icon}>
        <Icon color="#1b6fd7" size={size === 'small' ? 17 : 21} strokeWidth={2.3} />
      </View>
      <Text style={[styles.text, styles[size]]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    minWidth: 0,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconSmall: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 7,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  text: {
    color: '#151922',
    flexShrink: 1,
    fontWeight: '900',
  },
  large: {
    fontSize: 26,
    lineHeight: 32,
  },
  medium: {
    fontSize: 20,
    lineHeight: 26,
  },
  small: {
    fontSize: 16,
    lineHeight: 21,
  },
});

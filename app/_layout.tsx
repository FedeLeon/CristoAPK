import { useMutation, useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  GraduationCap,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { Link, router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout, me } from '../src/api/auth';
import { getNotifications, markNotificationsRead } from '../src/api/notifications';
import { getAuthToken } from '../src/auth/tokenStorage';
import { ScreenTitle, ScreenTitleIcon } from '../src/components/ScreenTitle';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 30,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <View style={styles.shell}>
          <LogicalAndroidBackHandler />
          <StatusBar hidden={false} style="dark" />
          <View style={styles.stackArea}>
            <Stack
              screenOptions={{
                headerLeft: () => <HeaderBackButton />,
                headerRight: () => <HeaderActions />,
                headerTitle: () => <AppHeaderTitle />,
                headerStyle: { backgroundColor: '#ffffff' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: '#f6f7fb' },
              }}
            >
              <Stack.Screen name="index" options={{ headerBackVisible: false, title: 'MDS' }} />
              <Stack.Screen name="login" options={{ title: 'Ingresar' }} />
              <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
              <Stack.Screen name="anuncios/index" options={{ title: 'Anuncios' }} />
              <Stack.Screen name="anuncios/[id]" options={{ title: 'Anuncio' }} />
              <Stack.Screen name="cursos/index" options={{ title: 'Contenido' }} />
              <Stack.Screen name="cursos/[id]" options={{ title: 'Contenido' }} />
              <Stack.Screen name="cursos/[id]/lecciones/[lessonId]" options={{ title: 'Leccion' }} />
              <Stack.Screen name="biblia/index" options={{ title: 'Biblia' }} />
              <Stack.Screen name="reuniones" options={{ title: 'Mis reuniones' }} />
              <Stack.Screen name="reuniones/[id]" options={{ title: 'Reunion' }} />
              <Stack.Screen name="chat/index" options={{ title: 'Chat' }} />
              <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
            </Stack>
          </View>
          <BottomNavigation />
        </View>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function getHeaderTitle(pathname: string): { icon: ScreenTitleIcon; text: string } {
  if (pathname === '/login') {
    return { icon: 'login', text: 'Ingresar' };
  }

  if (pathname === '/perfil') {
    return { icon: 'profile', text: 'Mi perfil' };
  }

  if (pathname.startsWith('/anuncios')) {
    return { icon: 'announcements', text: pathname === '/anuncios' ? 'Anuncios' : 'Anuncio' };
  }

  if (pathname.startsWith('/cursos/') && pathname.includes('/lecciones/')) {
    return { icon: 'lesson', text: 'Leccion' };
  }

  if (pathname.startsWith('/cursos')) {
    return { icon: 'content', text: 'Contenido' };
  }

  if (pathname.startsWith('/biblia')) {
    return { icon: 'bible', text: 'Biblia' };
  }

  if (pathname.startsWith('/reuniones/')) {
    return { icon: 'meetings', text: 'Reunion' };
  }

  if (pathname.startsWith('/reuniones')) {
    return { icon: 'meetings', text: 'Mis reuniones' };
  }

  if (pathname.startsWith('/chat')) {
    return { icon: 'chat', text: 'Chat' };
  }

  return { icon: 'home', text: 'MDS' };
}

function AppHeaderTitle() {
  const pathname = usePathname();
  const title = getHeaderTitle(pathname);

  return <ScreenTitle icon={title.icon} size="small" text={title.text} />;
}

function getParentRoute(pathname: string) {
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  if (pathname === '/perfil' || pathname === '/anuncios' || pathname === '/cursos' || pathname === '/biblia') {
    return '/';
  }

  if (pathname === '/reuniones' || pathname === '/chat') {
    return '/';
  }

  if (pathname.startsWith('/anuncios/')) {
    return '/anuncios';
  }

  if (pathname.startsWith('/reuniones/')) {
    return '/reuniones';
  }

  if (pathname.startsWith('/chat/')) {
    return '/chat';
  }

  const lessonMatch = pathname.match(/^\/cursos\/([^/]+)\/lecciones\/[^/]+$/);
  if (lessonMatch) {
    return `/cursos/${lessonMatch[1]}`;
  }

  if (pathname.startsWith('/cursos/')) {
    return '/cursos';
  }

  return '/';
}

function LogicalAndroidBackHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const parentRoute = getParentRoute(pathname);

      if (parentRoute) {
        router.replace(parentRoute);
      }

      return true;
    });

    return () => subscription.remove();
  }, [pathname]);

  return null;
}

function HeaderBackButton() {
  const pathname = usePathname();
  const parentRoute = getParentRoute(pathname);

  if (!parentRoute) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel="Volver"
      accessibilityRole="button"
      onPress={() => router.replace(parentRoute)}
      style={styles.headerBackButton}
    >
      <ArrowLeft color="#1f2937" size={22} strokeWidth={2.3} />
    </Pressable>
  );
}

function HeaderActions() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [openMenu, setOpenMenu] = useState<'notifications' | 'profile' | null>(null);

  const tokenQuery = useQuery({
    queryKey: ['auth-token'],
    queryFn: getAuthToken,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: Boolean(tokenQuery.data),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    enabled: Boolean(tokenQuery.data && meQuery.data),
    refetchInterval: 1000 * 60,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      setOpenMenu(null);
      await queryClient.invalidateQueries();
      router.replace('/login');
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const isLoggedIn = Boolean(tokenQuery.data && meQuery.data);
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;
  const initial = meQuery.data?.name?.trim()?.charAt(0)?.toUpperCase() || 'M';

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  if (!isLoggedIn) {
    return (
      <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.headerLoginButton}>
        <LogIn color="#1b6fd7" size={19} strokeWidth={2.2} />
        <Text style={styles.headerLoginText}>Ingresar</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.headerActions}>
      {openMenu === 'notifications' ? (
        <View style={styles.headerDropdown}>
          <View style={styles.headerDropdownTitleRow}>
            <Text style={styles.headerDropdownTitle}>Notificaciones</Text>
            {unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                disabled={markReadMutation.isPending}
                onPress={() => markReadMutation.mutate()}
              >
                <Text style={styles.markReadText}>Marcar leidas</Text>
              </Pressable>
            ) : null}
          </View>

          {notificationsQuery.isLoading ? (
            <Text style={styles.dropdownMuted}>Cargando...</Text>
          ) : notificationsQuery.data?.data.length ? (
            notificationsQuery.data.data.slice(0, 5).map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <Text style={styles.notificationText}>{notification.message}</Text>
                <Text style={styles.notificationDate}>{formatShortDate(notification.created_at)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.dropdownMuted}>No tenes notificaciones.</Text>
          )}
        </View>
      ) : null}

      {openMenu === 'profile' ? (
        <View style={styles.headerDropdown}>
          <DropdownItem icon={CircleUserRound} label="Mi perfil" onPress={() => router.push('/perfil')} />
          <Pressable
            accessibilityRole="button"
            disabled={logoutMutation.isPending}
            onPress={() => logoutMutation.mutate()}
            style={StyleSheet.flatten([
              styles.dropdownItem,
              styles.dropdownItemDanger,
              logoutMutation.isPending && styles.dropdownItemDisabled,
            ])}
          >
            <LogOut color="#b42318" size={20} strokeWidth={2.2} />
            <Text style={styles.dropdownTextDanger}>
              {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar sesion'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: openMenu === 'notifications' }}
        onPress={() => setOpenMenu((current) => (current === 'notifications' ? null : 'notifications'))}
        style={styles.headerIconButton}
      >
        <Bell color="#64748b" size={21} strokeWidth={2.2} />
        {unreadCount > 0 ? (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: openMenu === 'profile' }}
        onPress={() => setOpenMenu((current) => (current === 'profile' ? null : 'profile'))}
        style={styles.avatarButton}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>
    </View>
  );
}

function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [openMenu, setOpenMenu] = useState<'content' | 'meetings' | null>(null);

  const tokenQuery = useQuery({
    queryKey: ['auth-token'],
    queryFn: getAuthToken,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: Boolean(tokenQuery.data),
  });

  const isLoggedIn = Boolean(tokenQuery.data && meQuery.data);
  const isContentActive = pathname.startsWith('/cursos') || pathname.startsWith('/biblia');
  const isMeetingsActive = pathname.startsWith('/reuniones') || pathname.startsWith('/chat');

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const menuBottom = Math.max(insets.bottom, 8) + 72;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View>
      {openMenu === 'content' ? (
        <View style={[styles.dropdownMenu, styles.dropdownMenuLeft, { bottom: menuBottom }]}>
          <DropdownItem icon={GraduationCap} label="Contenido general" onPress={() => router.push('/cursos')} />
          <DropdownItem icon={BookOpen} label="Biblia" onPress={() => router.push('/biblia')} />
        </View>
      ) : null}

      {openMenu === 'meetings' ? (
        <View style={[styles.dropdownMenu, styles.dropdownMenuRight, { bottom: menuBottom }]}>
          <DropdownItem icon={CalendarDays} label="Mis reuniones" onPress={() => router.push('/reuniones')} />
          <DropdownItem icon={MessageCircle} label="Chat" onPress={() => router.push('/chat')} />
        </View>
      ) : null}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityState={{ selected: pathname === '/' }}
            style={StyleSheet.flatten([styles.bottomNavItem, pathname === '/' && styles.bottomNavItemActive])}
          >
            <Home color={pathname === '/' ? '#1b6fd7' : '#64748b'} size={22} strokeWidth={2.2} />
            <Text style={[styles.bottomNavText, pathname === '/' && styles.bottomNavTextActive]}>Inicio</Text>
          </Pressable>
        </Link>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: openMenu === 'content', selected: isContentActive }}
          onPress={() => setOpenMenu((current) => (current === 'content' ? null : 'content'))}
          style={StyleSheet.flatten([styles.bottomNavItem, isContentActive && styles.bottomNavItemActive])}
        >
          <GraduationCap color={isContentActive ? '#1b6fd7' : '#64748b'} size={22} strokeWidth={2.2} />
          <Text style={[styles.bottomNavText, isContentActive && styles.bottomNavTextActive]}>Contenido</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: openMenu === 'meetings', selected: isMeetingsActive }}
          onPress={() => setOpenMenu((current) => (current === 'meetings' ? null : 'meetings'))}
          style={StyleSheet.flatten([styles.bottomNavItem, isMeetingsActive && styles.bottomNavItemActive])}
        >
          <CalendarDays color={isMeetingsActive ? '#1b6fd7' : '#64748b'} size={22} strokeWidth={2.2} />
          <Text style={[styles.bottomNavText, isMeetingsActive && styles.bottomNavTextActive]}>Reuniones</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof Home;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.dropdownItem}>
      <Icon color="#1b6fd7" size={20} strokeWidth={2.2} />
      <Text style={styles.dropdownText}>{label}</Text>
    </Pressable>
  );
}

function formatShortDate(value?: string | null) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#f6f7fb',
    flex: 1,
  },
  stackArea: {
    flex: 1,
  },
  headerBackButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginLeft: 4,
    width: 36,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerIconButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  headerLoginButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerLoginText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 3,
    top: 3,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  headerDropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 8,
    position: 'absolute',
    right: 0,
    top: 44,
    width: 280,
    zIndex: 20,
  },
  headerDropdownTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerDropdownTitle: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '900',
  },
  markReadText: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '800',
  },
  notificationItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  notificationText: {
    color: '#2f3947',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  notificationDate: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownMuted: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    padding: 8,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopColor: '#dce2ea',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  bottomNavItem: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  bottomNavItemActive: {
    backgroundColor: '#e8f1ff',
  },
  bottomNavText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNavTextActive: {
    color: '#1b6fd7',
  },
  dropdownMenu: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 6,
    position: 'absolute',
    width: 210,
    zIndex: 10,
  },
  dropdownMenuLeft: {
    left: 72,
  },
  dropdownMenuRight: {
    right: 12,
  },
  dropdownItem: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownItemDanger: {
    backgroundColor: '#fff7f7',
  },
  dropdownItemDisabled: {
    opacity: 0.6,
  },
  dropdownText: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownTextDanger: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '800',
  },
});

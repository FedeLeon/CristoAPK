import { useMutation, useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CircleUserRound,
  GraduationCap,
  HeartHandshake,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  ArrowLeft,
  UserCog,
  UsersRound,
} from 'lucide-react-native';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BackHandler, Image, Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout, me } from '../src/api/auth';
import { getNotifications, markNotificationsRead } from '../src/api/notifications';
import { getAuthToken } from '../src/auth/tokenStorage';
import { AppBackground } from '../src/components/AppBackground';
import { NotificationListItem } from '../src/components/NotificationListItem';
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
          <AppBackground />
          <LogicalAndroidBackHandler />
          <StatusBar hidden={false} style="light" />
          <View style={styles.stackArea}>
            <Stack
              screenOptions={{
                headerLeft: () => <HeaderBackButton />,
                headerRight: () => <HeaderActions />,
                headerTitle: () => <AppHeaderTitle />,
                headerStyle: { backgroundColor: '#12365c' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            >
              <Stack.Screen name="index" options={{ headerBackVisible: false, headerTitleAlign: 'left', title: 'MDS' }} />
              <Stack.Screen name="login" options={{ headerShown: false, title: 'Ingresar' }} />
              <Stack.Screen name="registro" options={{ headerShown: false, title: 'Registrarme' }} />
              <Stack.Screen name="olvide-mi-contrasena" options={{ headerShown: false, title: 'Recuperar contrasena' }} />
              <Stack.Screen name="perfil" options={{ title: 'Mi perfil' }} />
              <Stack.Screen name="orientacion-pastoral" options={{ title: 'Orientacion pastoral' }} />
              <Stack.Screen name="usuarios" options={{ title: 'Usuarios' }} />
              <Stack.Screen name="individuos" options={{ title: 'Individuos' }} />
              <Stack.Screen name="anuncios/index" options={{ title: 'Anuncios' }} />
              <Stack.Screen name="anuncios/[id]" options={{ title: 'Anuncio' }} />
              <Stack.Screen name="notificaciones/index" options={{ title: 'Notificaciones' }} />
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

  if (pathname === '/orientacion-pastoral') {
    return { icon: 'pastoral', text: 'Orientacion pastoral' };
  }

  if (pathname === '/usuarios') {
    return { icon: 'users', text: 'Usuarios' };
  }

  if (pathname.startsWith('/individuos')) {
    return { icon: 'users', text: 'Individuos' };
  }

  if (pathname.startsWith('/anuncios')) {
    return { icon: 'announcements', text: pathname === '/anuncios' ? 'Anuncios' : 'Anuncio' };
  }

  if (pathname.startsWith('/notificaciones')) {
    return { icon: 'notifications', text: 'Notificaciones' };
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

  if (pathname === '/') {
    return (
      <View style={styles.headerBrandTitle}>
        <Image source={require('../assets/brand/mds-dove-white.png')} style={styles.headerBrandLogo} />
      </View>
    );
  }

  return <ScreenTitle icon={title.icon} size="small" text={title.text} tone="inverted" />;
}

function getParentRoute(pathname: string) {
  if (pathname === '/' || pathname === '/login') {
    return null;
  }

  if (pathname === '/registro' || pathname === '/olvide-mi-contrasena') {
    return '/login';
  }

  if (
    pathname === '/perfil' ||
    pathname === '/orientacion-pastoral' ||
    pathname === '/usuarios' ||
    pathname === '/individuos' ||
    pathname === '/anuncios' ||
    pathname === '/notificaciones' ||
    pathname === '/cursos' ||
    pathname === '/biblia'
  ) {
    return '/';
  }

  if (pathname === '/reuniones' || pathname === '/chat') {
    return '/';
  }

  if (pathname.startsWith('/anuncios/')) {
    return '/anuncios';
  }

  if (pathname.startsWith('/notificaciones/')) {
    return '/notificaciones';
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
      <ArrowLeft color="#ffffff" size={22} strokeWidth={2.3} />
    </Pressable>
  );
}

function HeaderActions() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
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
  const avatarUrl = meQuery.data?.avatar_url;
  const avatarInitials = meQuery.data?.avatar_initials || meQuery.data?.name?.trim()?.charAt(0)?.toUpperCase() || 'M';
  const avatarColor = meQuery.data?.avatar_color || '#1b6fd7';

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  if (!isLoggedIn) {
    return (
      <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.headerLoginButton}>
        <LogIn color="#ffffff" size={19} strokeWidth={2.2} />
        <Text style={styles.headerLoginText}>Ingresar</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.headerActions}>
      <Modal
        animationType="fade"
        onRequestClose={() => setOpenMenu(null)}
        transparent
        visible={openMenu !== null}
      >
        <View style={styles.headerOverlay}>
          <Pressable accessibilityRole="button" onPress={() => setOpenMenu(null)} style={styles.headerBackdrop} />
          <View style={[styles.headerDropdown, { top: Math.max(insets.top, 12) + 52 }]}>
            {openMenu === 'notifications' ? (
              <>
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
                    <NotificationListItem compact key={notification.id} notification={notification} />
                  ))
                ) : (
                  <Text style={styles.dropdownMuted}>No tenes notificaciones.</Text>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setOpenMenu(null);
                    router.push('/notificaciones');
                  }}
                  style={styles.viewAllNotificationsButton}
                >
                  <Text style={styles.viewAllNotificationsText}>Ver todas</Text>
                </Pressable>
              </>
            ) : null}

            {openMenu === 'profile' ? (
              <>
                <DropdownItem
                  icon={CircleUserRound}
                  label="Mi perfil"
                  onPress={() => {
                    setOpenMenu(null);
                    router.push('/perfil');
                  }}
                />
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
              </>
            ) : null}
          </View>
        </View>
      </Modal>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: openMenu === 'notifications' }}
        onPress={() => setOpenMenu((current) => (current === 'notifications' ? null : 'notifications'))}
        style={styles.headerIconButton}
      >
        <Bell color="#f8fafc" size={21} strokeWidth={2.2} />
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
        style={StyleSheet.flatten([styles.avatarButton, !avatarUrl && { backgroundColor: avatarColor }])}
      >
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{avatarInitials}</Text>
        )}
      </Pressable>
    </View>
  );
}

function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [openMenu, setOpenMenu] = useState<'content' | 'individuals' | 'meetings' | 'users' | null>(null);

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
  const isStudent = meQuery.data?.role === 'student';
  const isTutor = meQuery.data?.role === 'tutor';
  const isAdmin = meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin';
  const isContentActive = pathname.startsWith('/cursos') || pathname.startsWith('/biblia');
  const isMeetingsActive = pathname.startsWith('/reuniones') || pathname.startsWith('/chat');
  const isPastoralActive = pathname.startsWith('/orientacion-pastoral');
  const isUsersActive = pathname.startsWith('/usuarios');
  const isIndividualsActive = pathname.startsWith('/individuos');

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const bottomSafeArea = Math.max(insets.bottom, 8);
  const bottomNavHeight = bottomSafeArea + 60;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.bottomNavigationShell}>
      {openMenu === 'content' ? (
        <View style={[styles.dropdownMenu, { bottom: bottomNavHeight }]}>
          <BottomMenuItem icon={GraduationCap} label="Contenido general" onPress={() => router.push('/cursos')} />
          <BottomMenuItem icon={BookOpen} label="Biblia" onPress={() => router.push('/biblia')} />
        </View>
      ) : null}

      {openMenu === 'meetings' ? (
        <View style={[styles.dropdownMenu, { bottom: bottomNavHeight }]}>
          <BottomMenuItem icon={CalendarDays} label="Mis reuniones" onPress={() => router.push('/reuniones')} />
          <BottomMenuItem icon={MessageCircle} label="Chat" onPress={() => router.push('/chat')} />
        </View>
      ) : null}

      {openMenu === 'users' ? (
        <View style={[styles.dropdownMenu, { bottom: bottomNavHeight }]}>
          <BottomMenuItem
            icon={UserCog}
            label="Listado de usuarios"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/usuarios', params: { tab: 'students' } });
            }}
          />
          <BottomMenuItem
            icon={UsersRound}
            label="Grupos"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/usuarios', params: { tab: 'groups' } });
            }}
          />
        </View>
      ) : null}

      {openMenu === 'individuals' ? (
        <View style={[styles.dropdownMenu, styles.dropdownMenuGrid, { bottom: bottomNavHeight }]}>
          <BottomMenuItem
            icon={UsersRound}
            label="Todos"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/individuos', params: { tab: 'all' } });
            }}
            style={styles.dropdownMenuGridItem}
          />
          <BottomMenuItem
            icon={CircleUserRound}
            label="Pastores"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/individuos', params: { tab: 'pastors' } });
            }}
            style={styles.dropdownMenuGridItem}
          />
          <BottomMenuItem
            icon={UserCog}
            label="Tutores"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/individuos', params: { tab: 'tutors' } });
            }}
            style={styles.dropdownMenuGridItem}
          />
          <BottomMenuItem
            icon={UsersRound}
            label="Usuarios"
            onPress={() => {
              setOpenMenu(null);
              router.push({ pathname: '/individuos', params: { tab: 'students' } });
            }}
            style={styles.dropdownMenuGridItem}
          />
        </View>
      ) : null}

      <View style={[styles.bottomNav, { paddingBottom: bottomSafeArea }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: pathname === '/' }}
          onPress={() => router.replace('/')}
          style={({ pressed }) =>
            StyleSheet.flatten([styles.bottomNavItem, pathname === '/' && styles.bottomNavItemActive, pressed && styles.bottomNavItemPressed])
          }
        >
          <Home color={pathname === '/' ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
          <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.bottomNavText, pathname === '/' && styles.bottomNavTextActive]}>
            Inicio
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: openMenu === 'content', selected: isContentActive }}
          onPress={() => setOpenMenu((current) => (current === 'content' ? null : 'content'))}
          style={({ pressed }) =>
            StyleSheet.flatten([
              styles.bottomNavItem,
              (isContentActive || openMenu === 'content') && styles.bottomNavItemActive,
              pressed && styles.bottomNavItemPressed,
            ])
          }
        >
          <GraduationCap color={isContentActive || openMenu === 'content' ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={[styles.bottomNavText, (isContentActive || openMenu === 'content') && styles.bottomNavTextActive]}
          >
            Contenido
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: openMenu === 'meetings', selected: isMeetingsActive }}
          onPress={() => setOpenMenu((current) => (current === 'meetings' ? null : 'meetings'))}
          style={({ pressed }) =>
            StyleSheet.flatten([
              styles.bottomNavItem,
              (isMeetingsActive || openMenu === 'meetings') && styles.bottomNavItemActive,
              pressed && styles.bottomNavItemPressed,
            ])
          }
        >
          <CalendarDays color={isMeetingsActive || openMenu === 'meetings' ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.78}
            numberOfLines={1}
            style={[styles.bottomNavText, (isMeetingsActive || openMenu === 'meetings') && styles.bottomNavTextActive]}
          >
            Reuniones
          </Text>
        </Pressable>

        {isStudent ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isPastoralActive }}
            onPress={() => router.push('/orientacion-pastoral')}
            style={({ pressed }) =>
              StyleSheet.flatten([styles.bottomNavItem, isPastoralActive && styles.bottomNavItemActive, pressed && styles.bottomNavItemPressed])
            }
          >
            <HeartHandshake color={isPastoralActive ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
            <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.bottomNavText, isPastoralActive && styles.bottomNavTextActive]}>
              Orientacion
            </Text>
          </Pressable>
        ) : null}

        {isTutor ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: openMenu === 'users', selected: isUsersActive }}
            onPress={() => setOpenMenu((current) => (current === 'users' ? null : 'users'))}
            style={({ pressed }) =>
              StyleSheet.flatten([
                styles.bottomNavItem,
                (isUsersActive || openMenu === 'users') && styles.bottomNavItemActive,
                pressed && styles.bottomNavItemPressed,
              ])
            }
          >
            <UsersRound color={isUsersActive || openMenu === 'users' ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              numberOfLines={1}
              style={[styles.bottomNavText, (isUsersActive || openMenu === 'users') && styles.bottomNavTextActive]}
            >
              Usuarios
            </Text>
          </Pressable>
        ) : null}

        {isAdmin ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: openMenu === 'individuals', selected: isIndividualsActive }}
            onPress={() => setOpenMenu((current) => (current === 'individuals' ? null : 'individuals'))}
            style={({ pressed }) =>
              StyleSheet.flatten([
                styles.bottomNavItem,
                (isIndividualsActive || openMenu === 'individuals') && styles.bottomNavItemActive,
                pressed && styles.bottomNavItemPressed,
              ])
            }
          >
            <UsersRound color={isIndividualsActive || openMenu === 'individuals' ? '#ffffff' : '#d7e6f3'} size={22} strokeWidth={2.2} />
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              style={[styles.bottomNavText, (isIndividualsActive || openMenu === 'individuals') && styles.bottomNavTextActive]}
            >
              Individuos
            </Text>
          </Pressable>
        ) : null}
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

function BottomMenuItem({
  icon: Icon,
  label,
  onPress,
  style,
}: {
  icon: typeof Home;
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => StyleSheet.flatten([styles.bottomMenuItem, style, pressed && styles.bottomMenuItemPressed])}
    >
      <View style={styles.bottomMenuIcon}>
        <Icon color="#ffffff" size={21} strokeWidth={2.25} />
      </View>
      <Text style={styles.bottomMenuText}>{label}</Text>
    </Pressable>
  );
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
  headerBrandTitle: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBrandLogo: {
    height: 36,
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
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
  headerOverlay: {
    flex: 1,
  },
  headerBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  headerDropdown: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 12,
    gap: 6,
    padding: 8,
    position: 'absolute',
    right: 12,
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
  dropdownMuted: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    padding: 8,
  },
  viewAllNotificationsButton: {
    alignItems: 'center',
    backgroundColor: '#12365c',
    borderRadius: 8,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  viewAllNotificationsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  bottomNavigationShell: {
    position: 'relative',
    width: '100%',
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: '#12365c',
    borderTopColor: '#0f2d4d',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 8,
    width: '100%',
  },
  bottomNavItem: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    gap: 3,
    justifyContent: 'center',
    height: 52,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  bottomNavItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  bottomNavItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    transform: [{ translateY: -1 }],
  },
  bottomNavText: {
    color: '#d7e6f3',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  bottomNavTextActive: {
    color: '#ffffff',
  },
  dropdownMenu: {
    backgroundColor: '#0f2d4d',
    borderColor: '#0f2d4d',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    elevation: 14,
    flexDirection: 'row',
    gap: 10,
    left: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    width: '100%',
    zIndex: 30,
  },
  dropdownMenuGrid: {
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownMenuGridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  bottomMenuItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  bottomMenuItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.42)',
  },
  bottomMenuIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  bottomMenuText: {
    color: '#f8fafc',
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
    textAlign: 'left',
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

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { BookOpen, CalendarDays, GraduationCap, MessageCircle } from 'lucide-react-native';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { getAuthToken } from '../src/auth/tokenStorage';
import { ApiUser } from '../src/types/api';

function getRoleDashboard(user?: ApiUser) {
  if (!user) {
    return {
      label: 'Visitante',
      title: 'Bienvenido a MDS',
      message: 'Mensaje de salvacion',
    };
  }

  if (user.role === 'admin') {
    return {
      label: 'Administrador',
      title: 'Dashboard Admin',
      message: 'Bienvenido al panel mobile de administracion.',
    };
  }

  if (user.role === 'tutor') {
    return {
      label: 'Tutor',
      title: 'Dashboard Tutor',
      message: 'Bienvenido al panel mobile de acompanamiento.',
    };
  }

  return {
    label: 'Usuario',
    title: 'Dashboard Usuario',
    message: 'Bienvenido a tu espacio mobile de aprendizaje.',
  };
}

export default function HomeScreen() {
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
  const dashboard = getRoleDashboard(meQuery.data);
  const quickActions = [
    { icon: GraduationCap, label: 'Contenido general', route: '/cursos' },
    { icon: BookOpen, label: 'Biblia', route: '/biblia' },
    { icon: CalendarDays, label: 'Reuniones', route: '/reuniones' },
    { icon: MessageCircle, label: 'Chat', route: '/chat' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.brandPanel}>
        <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
        <Text style={styles.roleBadge}>{dashboard.label}</Text>
        <Text style={styles.title}>{isLoggedIn ? dashboard.title : 'Bienvenido a MDS'}</Text>
        <Text style={styles.subtitle}>{isLoggedIn ? dashboard.message : 'Mensaje de salvacion'}</Text>
        {tokenQuery.isLoading || meQuery.isLoading ? (
          <View style={styles.sessionRow}>
            <ActivityIndicator />
            <Text style={styles.sessionText}>Cargando sesion...</Text>
          </View>
        ) : null}
        {meQuery.isError ? <Text style={styles.error}>{getApiErrorMessage(meQuery.error)}</Text> : null}
        {isLoggedIn ? (
          <Text style={styles.sessionText}>
            {meQuery.data?.name} - {meQuery.data?.email}
          </Text>
        ) : null}
      </View>

      {isLoggedIn ? (
        <View style={styles.quickGrid}>
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Pressable key={action.route} style={styles.quickButton} onPress={() => router.push(action.route)}>
                <Icon color="#1b6fd7" size={28} strokeWidth={2.1} />
                <Text style={styles.quickButtonText}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Ingresar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    padding: 28,
  },
  brandPanel: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: '100%',
  },
  logo: {
    borderRadius: 24,
    height: 116,
    marginBottom: 4,
    width: 116,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#516070',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    color: '#1b4f91',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  sessionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sessionText: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 126,
    padding: 12,
  },
  quickButtonText: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

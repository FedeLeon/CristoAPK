import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { logout, me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { getAuthToken } from '../src/auth/tokenStorage';

export default function HomeScreen() {
  const queryClient = useQueryClient();

  const tokenQuery = useQuery({
    queryKey: ['auth-token'],
    queryFn: getAuthToken,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: Boolean(tokenQuery.data),
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.replace('/login');
    },
  });

  if (tokenQuery.isLoading || meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando sesion...</Text>
      </View>
    );
  }

  if (!tokenQuery.data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>CristoApp</Text>
        <Text style={styles.text}>Ingresa para conectar la APK con la API Laravel.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Ingresar</Text>
        </Pressable>
      </View>
    );
  }

  if (meQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sesion no disponible</Text>
        <Text style={styles.error}>{getApiErrorMessage(meQuery.error)}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryButtonText}>Volver al login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Bienvenido</Text>
      <Text style={styles.title}>{meQuery.data?.name}</Text>
      <Text style={styles.text}>{meQuery.data?.email}</Text>

      <View style={styles.menu}>
        <Link href="/cursos" asChild>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuTitle}>Cursos</Text>
            <Text style={styles.menuText}>Ver listado desde GET /api/cursos.</Text>
          </Pressable>
        </Link>

        <Link href="/biblia" asChild>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuTitle}>Biblia</Text>
            <Text style={styles.menuText}>Consultar versiones y libros disponibles.</Text>
          </Pressable>
        </Link>
      </View>

      <Pressable
        disabled={logoutMutation.isPending}
        style={[styles.secondaryButton, logoutMutation.isPending && styles.disabledButton]}
        onPress={() => logoutMutation.mutate()}
      >
        <Text style={styles.secondaryButtonText}>
          {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar sesion'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    color: '#516070',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
  },
  text: {
    color: '#3e4654',
    fontSize: 16,
    lineHeight: 23,
  },
  muted: {
    color: '#606b7a',
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    lineHeight: 22,
  },
  menu: {
    gap: 12,
    marginTop: 8,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  menuTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '800',
  },
  menuText: {
    color: '#516070',
    fontSize: 14,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 'auto',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.65,
  },
});

import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';

function roleLabel(role?: string) {
  if (role === 'admin') {
    return 'Administrador';
  }

  if (role === 'tutor') {
    return 'Tutor';
  }

  if (role === 'student') {
    return 'Usuario';
  }

  return role ?? 'Sin rol';
}

export default function ProfileScreen() {
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  if (meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando perfil...</Text>
      </View>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo cargar tu perfil</Text>
        {meQuery.error ? <Text style={styles.error}>{getApiErrorMessage(meQuery.error)}</Text> : null}
        <Pressable style={styles.secondaryButton} onPress={() => meQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Mi perfil</Text>
        <Text style={styles.title}>{meQuery.data.name}</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{meQuery.data.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{roleLabel(meQuery.data.role)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  eyebrow: {
    color: '#516070',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#151922',
    fontSize: 26,
    fontWeight: '800',
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    lineHeight: 22,
  },
  infoList: {
    gap: 10,
  },
  infoRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#2f3947',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '800',
  },
});

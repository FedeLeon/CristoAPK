import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { getCourses } from '../../src/api/courses';
import { getApiErrorMessage } from '../../src/api/client';

export default function CoursesScreen() {
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  });

  if (coursesQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando cursos...</Text>
      </View>
    );
  }

  if (coursesQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudieron cargar los cursos</Text>
        <Text style={styles.error}>{getApiErrorMessage(coursesQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => coursesQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={coursesQuery.data}
      keyExtractor={(item) => String(item.id)}
      refreshControl={
        <RefreshControl refreshing={coursesQuery.isRefetching} onRefresh={coursesQuery.refetch} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.title}>Sin cursos</Text>
          <Text style={styles.muted}>La API respondio correctamente, pero no devolvio cursos.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Link href={`/cursos/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{item.title ?? item.name ?? `Curso #${item.id}`}</Text>
            {item.description ? <Text style={styles.cardText}>{item.description}</Text> : null}
          </Pressable>
        </Link>
      )}
    />
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
    gap: 16,
    padding: 24,
  },
  list: {
    gap: 12,
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '800',
  },
  cardText: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  title: {
    color: '#151922',
    fontSize: 22,
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
  empty: {
    gap: 8,
    paddingVertical: 48,
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

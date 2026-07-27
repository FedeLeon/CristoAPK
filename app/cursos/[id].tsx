import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../src/api/client';
import { getCourse } from '../../src/api/courses';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const courseQuery = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
    enabled: Boolean(id),
  });

  if (courseQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando curso...</Text>
      </View>
    );
  }

  if (courseQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo cargar el curso</Text>
        <Text style={styles.error}>{getApiErrorMessage(courseQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => courseQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const course = courseQuery.data;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Curso #{course?.id}</Text>
      <Text style={styles.title}>{course?.title ?? course?.name ?? 'Curso'}</Text>
      {course?.description ? <Text style={styles.text}>{course.description}</Text> : null}
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
    gap: 14,
    padding: 24,
  },
  eyebrow: {
    color: '#516070',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#151922',
    fontSize: 28,
    fontWeight: '800',
  },
  text: {
    color: '#3e4654',
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    color: '#606b7a',
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    lineHeight: 22,
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

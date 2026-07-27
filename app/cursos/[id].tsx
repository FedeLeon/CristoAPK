import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
        <Text style={styles.muted}>Cargando contenido...</Text>
      </View>
    );
  }

  if (courseQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo cargar el contenido</Text>
        <Text style={styles.error}>{getApiErrorMessage(courseQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => courseQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const course = courseQuery.data;
  const progress = Math.max(0, Math.min(course?.progress_percentage ?? 0, 100));

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        {course?.image_url ? (
          <Image source={{ uri: course.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
      </View>

      <View style={styles.container}>
        <Text style={styles.eyebrow}>Contenido #{course?.id}</Text>
        <Text style={styles.title}>{course?.title ?? course?.name ?? 'Contenido'}</Text>
        {course?.subtitle ? <Text style={styles.subtitle}>{course.subtitle}</Text> : null}
        {course?.description ? <Text style={styles.text}>{course.description}</Text> : null}

        <View style={styles.metaGrid}>
          <MetaItem label="Modulos" value={String(course?.modules_count ?? 0)} />
          <MetaItem label="Lecciones" value={String(course?.lessons_count ?? 0)} />
          <MetaItem label="Duracion" value={course?.duration ?? 'Sin datos'} />
          <MetaItem label="Nivel" value={course?.level ?? 'Sin datos'} />
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso</Text>
            <Text style={styles.progressValue}>{progress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressCount}>
            {course?.completed_lessons_count ?? 0} / {course?.lessons_count ?? 0} lecciones
          </Text>
        </View>

        {course?.teacher?.name ? <Text style={styles.teacher}>Tutor: {course.teacher.name}</Text> : null}
      </View>
    </ScrollView>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
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
    gap: 14,
    padding: 24,
  },
  scroll: {
    paddingBottom: 24,
  },
  hero: {
    aspectRatio: 16 / 9,
    backgroundColor: '#e8edf4',
    width: '100%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '800',
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
  subtitle: {
    color: '#516070',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
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
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
    minHeight: 58,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#2f3947',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBlock: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: '#2f3947',
    fontSize: 13,
    fontWeight: '800',
  },
  progressValue: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '800',
  },
  progressTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    height: '100%',
  },
  progressCount: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  teacher: {
    color: '#516070',
    fontSize: 14,
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

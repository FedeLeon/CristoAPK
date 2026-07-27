import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../src/api/client';
import { getCourse } from '../../src/api/courses';
import { ScreenTitle } from '../../src/components/ScreenTitle';

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
        <ScreenTitle icon="content" text="No se pudo cargar el contenido" />
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
        <ScreenTitle icon="content" text={course?.title ?? course?.name ?? 'Contenido'} />
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

        <View style={styles.structureBlock}>
          <ScreenTitle icon="lesson" size="medium" text="Modulos y lecciones" />
          {course?.modules?.length ? (
            course.modules.map((module, moduleIndex) => (
              <View key={module.id} style={styles.moduleCard}>
                <Text style={styles.moduleEyebrow}>Modulo {moduleIndex + 1}</Text>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                {module.description ? <Text style={styles.moduleDescription}>{module.description}</Text> : null}

                <View style={styles.lessonList}>
                  {module.lessons?.length ? (
                    module.lessons.map((lesson, lessonIndex) => (
                      <Pressable
                        key={lesson.id}
                        onPress={() => router.push(`/cursos/${course.id}/lecciones/${lesson.id}`)}
                        style={styles.lessonButton}
                      >
                        <View style={styles.lessonNumber}>
                          <Text style={styles.lessonNumberText}>{lessonIndex + 1}</Text>
                        </View>
                        <View style={styles.lessonTextBlock}>
                          <Text style={styles.lessonTitle}>{lesson.title}</Text>
                          <Text style={styles.lessonMeta}>
                            {lesson.contents?.length ?? 0} materiales
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  ) : (
                    <Text style={styles.muted}>Este modulo no tiene lecciones.</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStructure}>
              <Text style={styles.muted}>Este contenido todavia no tiene modulos cargados.</Text>
            </View>
          )}
        </View>
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
  structureBlock: {
    gap: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#151922',
    fontSize: 20,
    fontWeight: '800',
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  moduleEyebrow: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  moduleTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '800',
  },
  moduleDescription: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
  lessonList: {
    gap: 8,
  },
  lessonButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10,
  },
  lessonNumber: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  lessonNumberText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  lessonTextBlock: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    color: '#2f3947',
    fontSize: 15,
    fontWeight: '800',
  },
  lessonMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyStructure: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
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

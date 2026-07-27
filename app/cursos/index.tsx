import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
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
        <Text style={styles.muted}>Cargando contenido...</Text>
      </View>
    );
  }

  if (coursesQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudo cargar el contenido</Text>
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
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Contenido</Text>
          <Text style={styles.muted}>Contenidos de ayuda disponibles para seguir desde la APK.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.title}>Sin contenido</Text>
          <Text style={styles.muted}>La API respondio correctamente, pero no devolvio contenidos.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const title = item.title ?? item.name ?? `Contenido #${item.id}`;
        const progress = Math.max(0, Math.min(item.progress_percentage ?? 0, 100));

        return (
          <Link href={`/cursos/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.media}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.image} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Sin imagen</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <View style={styles.titleBlock}>
                  <Text style={styles.cardTitle}>{title}</Text>
                  {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
                </View>

                {item.description ? (
                  <Text numberOfLines={3} style={styles.cardText}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.metaGrid}>
                  <MetaItem label="Modulos" value={String(item.modules_count ?? 0)} />
                  <MetaItem label="Lecciones" value={String(item.lessons_count ?? 0)} />
                  <MetaItem label="Duracion" value={item.duration ?? 'Sin datos'} />
                  <MetaItem label="Nivel" value={item.level ?? 'Sin datos'} />
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
                    {item.completed_lessons_count ?? 0} / {item.lessons_count ?? 0} lecciones
                  </Text>
                </View>

                {item.teacher?.name ? <Text style={styles.teacher}>Tutor: {item.teacher.name}</Text> : null}
              </View>
            </Pressable>
          </Link>
        );
      }}
    />
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
    flex: 1,
    gap: 16,
    padding: 24,
  },
  list: {
    gap: 14,
    padding: 16,
    paddingBottom: 22,
  },
  header: {
    gap: 6,
    paddingBottom: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  media: {
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
  cardBody: {
    gap: 12,
    padding: 16,
  },
  titleBlock: {
    gap: 4,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    color: '#516070',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardText: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
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
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 3,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    gap: 7,
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
    fontSize: 13,
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

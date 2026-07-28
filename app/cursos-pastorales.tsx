import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ClipboardCheck, RefreshCcw } from 'lucide-react-native';
import { getAdminPastoralCourses } from '../src/api/adminPastoralContent';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { AdminPastoralCourse } from '../src/types/api';

export default function AdminPastoralCoursesScreen() {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: me });
  const coursesQuery = useQuery({
    queryKey: ['admin-pastoral-courses'],
    queryFn: getAdminPastoralCourses,
    enabled: meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin',
  });

  if (meQuery.isLoading) {
    return <CenteredState text="Cargando sesion..." />;
  }

  if (meQuery.data?.role !== 'admin' && meQuery.data?.role !== 'superadmin') {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="content" text="Cursos pastorales" />
        <Text style={styles.error}>Esta seccion esta disponible solo para administradores.</Text>
      </View>
    );
  }

  if (coursesQuery.isLoading) {
    return <CenteredState text="Cargando examenes..." />;
  }

  if (coursesQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="content" text="No se pudo cargar examenes" />
        <Text style={styles.error}>{getApiErrorMessage(coursesQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => coursesQuery.refetch()}>
          <RefreshCcw color="#151922" size={18} strokeWidth={2.2} />
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
      refreshControl={<RefreshControl refreshing={coursesQuery.isRefetching} onRefresh={coursesQuery.refetch} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle icon="content" text="Examenes" />
          <Text style={styles.muted}>Cursos pastorales creados desde la app web para pastores.</Text>
        </View>
      }
      ListEmptyComponent={<EmptyCard text="Todavia no hay examenes pastorales cargados." />}
      renderItem={({ item }) => <PastoralCourseCard course={item} />}
    />
  );
}

function PastoralCourseCard({ course }: { course: AdminPastoralCourse }) {
  return (
    <View style={styles.card}>
      <View style={styles.media}>
        {course.image_url ? (
          <Image source={{ uri: course.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <ClipboardCheck color="#1b6fd7" size={28} strokeWidth={2.2} />
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{course.title}</Text>
          <Text style={styles.badge}>{course.publication_status === 'published' ? 'Publicado' : 'Borrador'}</Text>
        </View>
        {course.subtitle ? <Text style={styles.subtitle}>{course.subtitle}</Text> : null}
        {course.description ? <Text numberOfLines={3} style={styles.text}>{course.description}</Text> : null}
        <View style={styles.metaGrid}>
          <Meta label="Clases" value={String(course.lessons_count ?? 0)} />
          <Meta label="Modulos" value={String(course.modules_count ?? 0)} />
          <Meta label="Duracion" value={course.duration ?? 'Sin datos'} />
          <Meta label="Nivel" value={course.level ?? 'Sin datos'} />
        </View>
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function CenteredState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    color: '#1b4f91',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: {
    gap: 10,
    padding: 14,
  },
  cardTitle: {
    color: '#151922',
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 14,
    padding: 20,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  header: {
    gap: 8,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  list: {
    gap: 14,
    padding: 16,
    paddingBottom: 96,
  },
  media: {
    aspectRatio: 16 / 9,
    backgroundColor: '#e8edf4',
    width: '100%',
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
    padding: 9,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
  },
  metaValue: {
    color: '#151922',
    fontSize: 13,
    fontWeight: '800',
  },
  muted: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  subtitle: {
    color: '#516070',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  text: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
});

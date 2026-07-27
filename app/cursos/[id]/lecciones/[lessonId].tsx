import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../../../src/api/client';
import { getCourse } from '../../../../src/api/courses';
import { ScreenTitle } from '../../../../src/components/ScreenTitle';
import { LessonContent } from '../../../../src/types/api';

function contentLabel(type: string) {
  if (type === 'text') {
    return 'Texto';
  }

  if (type === 'image') {
    return 'Imagen';
  }

  if (type === 'video') {
    return 'Video';
  }

  if (type === 'file') {
    return 'Archivo';
  }

  return 'Material';
}

export default function LessonDetailScreen() {
  const { id, lessonId } = useLocalSearchParams<{ id: string; lessonId: string }>();

  const courseQuery = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourse(id),
    enabled: Boolean(id),
  });

  if (courseQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando leccion...</Text>
      </View>
    );
  }

  if (courseQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="lesson" text="No se pudo cargar la leccion" />
        <Text style={styles.error}>{getApiErrorMessage(courseQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => courseQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const modules = courseQuery.data?.modules ?? [];
  const lesson = modules.flatMap((module) => module.lessons ?? []).find((item) => String(item.id) === lessonId);

  if (!lesson) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="lesson" text="Leccion no encontrada" />
        <Text style={styles.muted}>El contenido cargo correctamente, pero no contiene esta leccion.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Leccion</Text>
        <ScreenTitle icon="lesson" text={lesson.title} />
        {lesson.description ? <Text style={styles.text}>{lesson.description}</Text> : null}
      </View>

      <View style={styles.materials}>
        <ScreenTitle icon="lesson" size="medium" text="Materiales" />
        {lesson.contents?.length ? (
          lesson.contents.map((content) => <LessonMaterial key={content.id} content={content} />)
        ) : (
          <View style={styles.empty}>
            <Text style={styles.muted}>Esta leccion todavia no tiene materiales cargados.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function LessonMaterial({ content }: { content: LessonContent }) {
  const asset = content.asset;
  const assetName = asset?.original_name ?? contentLabel(content.type);

  if (content.type === 'text') {
    return (
      <View style={styles.materialCard}>
        <Text style={styles.materialType}>Texto</Text>
        <Text style={styles.text}>{content.text_content ?? 'Sin texto cargado.'}</Text>
      </View>
    );
  }

  if (content.type === 'image' && asset?.url) {
    return (
      <View style={styles.materialCard}>
        <Text style={styles.materialType}>Imagen</Text>
        <Image source={{ uri: asset.url }} style={styles.materialImage} />
        <Text style={styles.assetName}>{assetName}</Text>
      </View>
    );
  }

  return (
    <View style={styles.materialCard}>
      <Text style={styles.materialType}>{contentLabel(content.type)}</Text>
      <Text style={styles.assetName}>{assetName}</Text>
      {asset?.mime ? <Text style={styles.muted}>{asset.mime}</Text> : null}
      {asset?.url ? (
        <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(asset.url)}>
          <Text style={styles.primaryButtonText}>Abrir material</Text>
        </Pressable>
      ) : (
        <Text style={styles.muted}>Material sin archivo disponible.</Text>
      )}
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
    gap: 14,
    padding: 24,
  },
  scroll: {
    gap: 16,
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  eyebrow: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#151922',
    fontSize: 24,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#151922',
    fontSize: 20,
    fontWeight: '800',
  },
  text: {
    color: '#3e4654',
    fontSize: 15,
    lineHeight: 22,
  },
  muted: {
    color: '#606b7a',
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    lineHeight: 22,
  },
  materials: {
    gap: 12,
  },
  materialCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  materialType: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  materialImage: {
    aspectRatio: 16 / 10,
    backgroundColor: '#e8edf4',
    borderRadius: 8,
    width: '100%',
  },
  assetName: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '800',
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
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

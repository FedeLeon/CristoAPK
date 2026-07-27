import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getBibleBooks, getBibleVersions } from '../../src/api/bible';
import { getApiErrorMessage } from '../../src/api/client';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { BibleVersion } from '../../src/types/api';

function versionCode(version: BibleVersion) {
  return version.code ?? version.abbreviation ?? String(version.id);
}

function versionDescription(version: BibleVersion) {
  if (version.language) {
    return version.language;
  }

  if (versionCode(version) === 'RVR1960') {
    return 'Traduccion clasica en espanol';
  }

  return 'Biblia disponible para lectura';
}

export default function BibleScreen() {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  const versionsQuery = useQuery({
    queryKey: ['bible-versions'],
    queryFn: getBibleVersions,
  });

  const booksQuery = useQuery({
    queryKey: ['bible-books'],
    queryFn: getBibleBooks,
  });

  const hasError = versionsQuery.isError || booksQuery.isError;
  const error = versionsQuery.error ?? booksQuery.error;
  const selectedVersion = versionsQuery.data?.find((version) => String(version.id) === selectedVersionId);
  const visibleBooks = selectedVersion
    ? booksQuery.data?.filter((book) => String(book.bible_version_id) === String(selectedVersion.id)) ?? []
    : [];

  if (versionsQuery.isLoading || booksQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando biblia...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="bible" text="No se pudo cargar biblia" />
        <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            versionsQuery.refetch();
            booksQuery.refetch();
          }}
        >
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ScreenTitle icon="bible" text="Biblia" />
        <Text style={styles.muted}>Elegi una version para comenzar la lectura.</Text>
      </View>

      {!selectedVersion ? (
        <View style={styles.section}>
          <ScreenTitle icon="bible" size="medium" text="Versiones disponibles" />
          {versionsQuery.data?.map((version) => (
            <Pressable key={String(version.id)} style={styles.versionCard} onPress={() => setSelectedVersionId(String(version.id))}>
              {version.image_url ? (
                <Image source={{ uri: version.image_url }} style={styles.versionImage} />
              ) : (
                <View style={styles.versionIcon}>
                  <BookOpen color="#1b6fd7" size={24} strokeWidth={2.2} />
                </View>
              )}
              <View style={styles.versionContent}>
                <Text style={styles.versionCode}>{versionCode(version)}</Text>
                <Text style={styles.versionTitle}>{version.name ?? versionCode(version)}</Text>
                <Text style={styles.versionMeta}>{versionDescription(version)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedTitleRow}>
              <CheckCircle2 color="#1b6fd7" size={20} strokeWidth={2.2} />
              <ScreenTitle icon="bible" size="medium" text={selectedVersion.name ?? versionCode(selectedVersion)} />
            </View>
            <Pressable style={styles.changeButton} onPress={() => setSelectedVersionId(null)}>
              <Text style={styles.changeButtonText}>Cambiar Biblia</Text>
            </Pressable>
          </View>

          <Text style={styles.muted}>Libros disponibles en {versionCode(selectedVersion)}.</Text>
          {visibleBooks.map((book) => (
            <View key={String(book.id)} style={styles.row}>
              <Text style={styles.rowTitle}>{book.name}</Text>
              {book.testament ? <Text style={styles.rowMeta}>{book.testament}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {versionsQuery.data && versionsQuery.data.length < 3 ? (
        <Text style={styles.muted}>Laravel devolvio {versionsQuery.data.length} versiones disponibles.</Text>
      ) : null}
    </ScrollView>
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
    gap: 16,
    padding: 16,
    paddingBottom: 112,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#151922',
    fontSize: 28,
    fontWeight: '800',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#2f3947',
    fontSize: 18,
    fontWeight: '800',
  },
  versionCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  versionIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 66,
    justifyContent: 'center',
    width: 108,
  },
  versionImage: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 66,
    width: 108,
  },
  versionContent: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  versionCode: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  versionTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  versionMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  selectedHeader: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  selectedTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  changeButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  changeButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '800',
  },
  row: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  rowTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#606b7a',
    fontSize: 13,
    marginTop: 4,
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

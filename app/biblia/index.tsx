import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getBibleBooks, getBibleVersions } from '../../src/api/bible';
import { getApiErrorMessage } from '../../src/api/client';

export default function BibleScreen() {
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
        <Text style={styles.title}>No se pudo cargar biblia</Text>
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
      <Text style={styles.title}>Biblia</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Versiones</Text>
        {versionsQuery.data?.map((version) => (
          <View key={String(version.id)} style={styles.row}>
            <Text style={styles.rowTitle}>{version.name ?? version.abbreviation ?? version.id}</Text>
            {version.abbreviation ? <Text style={styles.rowMeta}>{version.abbreviation}</Text> : null}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Libros</Text>
        {booksQuery.data?.map((book) => (
          <View key={String(book.id)} style={styles.row}>
            <Text style={styles.rowTitle}>{book.name}</Text>
          </View>
        ))}
      </View>
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

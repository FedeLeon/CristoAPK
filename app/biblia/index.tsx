import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Landmark,
  Mountain,
  ScrollText,
  Sun,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getBibleBooks, getBibleChapters, getBibleVersions } from '../../src/api/bible';
import { getApiErrorMessage } from '../../src/api/client';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { BibleBook, BibleChapter, BibleVersion } from '../../src/types/api';

const chapterVisuals = [
  { background: '#e8f1ff', color: '#1b6fd7', Icon: BookOpen },
  { background: '#fef3c7', color: '#a16207', Icon: Sun },
  { background: '#dcfce7', color: '#15803d', Icon: Mountain },
  { background: '#fee2e2', color: '#b42318', Icon: Flame },
  { background: '#ede9fe', color: '#6d28d9', Icon: Landmark },
  { background: '#e0f2fe', color: '#0369a1', Icon: ScrollText },
];

const testamentHeroImages: Record<string, ImageSourcePropType> = {
  'Antiguo Testamento': require('../../assets/bible/old-testament-hero.jpg'),
  'Nuevo Testamento': require('../../assets/bible/new-testament-hero.jpg'),
};

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

function getFirstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function chapterVisual(number: number) {
  return chapterVisuals[(Math.max(number, 1) - 1) % chapterVisuals.length];
}

function testamentLabel(testament?: string | null) {
  if (!testament) {
    return 'Libros';
  }

  return testament.toLowerCase().includes('nuevo') ? 'Nuevo Testamento' : 'Antiguo Testamento';
}

export default function BibleScreen() {
  const params = useLocalSearchParams<{ book?: string; chapter?: string }>();
  const routeBookId = getFirstParam(params.book);
  const routeChapter = getFirstParam(params.chapter);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const versionsQuery = useQuery({
    queryKey: ['bible-versions'],
    queryFn: getBibleVersions,
  });

  const booksQuery = useQuery({
    queryKey: ['bible-books'],
    queryFn: getBibleBooks,
  });

  const selectedVersion = versionsQuery.data?.find((version) => String(version.id) === selectedVersionId);
  const selectedBook = booksQuery.data?.find((book) => String(book.id) === selectedBookId);

  const chaptersQuery = useQuery({
    queryKey: ['bible-chapters', selectedBookId],
    queryFn: () => getBibleChapters(selectedBookId ?? ''),
    enabled: Boolean(selectedBookId),
  });

  const selectedChapter = chaptersQuery.data?.find((chapter) => String(chapter.id) === selectedChapterId);
  const selectedChapterIndex = (chaptersQuery.data ?? []).findIndex((chapter) => String(chapter.id) === selectedChapterId);
  const previousChapter = selectedChapterIndex > 0 ? chaptersQuery.data?.[selectedChapterIndex - 1] : null;
  const nextChapter =
    selectedChapterIndex >= 0 && chaptersQuery.data && selectedChapterIndex < chaptersQuery.data.length - 1
      ? chaptersQuery.data[selectedChapterIndex + 1]
      : null;

  useEffect(() => {
    if (selectedBookId || !routeBookId || !booksQuery.data) {
      return;
    }

    const normalizedRouteBook = routeBookId.toUpperCase();
    const routeBook = booksQuery.data.find(
      (book) => String(book.id) === routeBookId || (book.usfm ?? '').toUpperCase() === normalizedRouteBook,
    );

    if (routeBook) {
      setSelectedBookId(String(routeBook.id));

      if (routeBook.bible_version_id) {
        setSelectedVersionId(String(routeBook.bible_version_id));
      }
    }
  }, [booksQuery.data, routeBookId, selectedBookId]);

  useEffect(() => {
    if (selectedChapterId || !routeChapter || !chaptersQuery.data) {
      return;
    }

    const routeSelectedChapter = chaptersQuery.data.find(
      (chapter) => String(chapter.number) === routeChapter || String(chapter.id) === routeChapter,
    );

    if (routeSelectedChapter) {
      setSelectedChapterId(String(routeSelectedChapter.id));
    }
  }, [chaptersQuery.data, routeChapter, selectedChapterId]);

  const visibleBooks = useMemo(() => {
    if (!selectedVersion) {
      return [];
    }

    return (booksQuery.data ?? [])
      .filter((book) => String(book.bible_version_id) === String(selectedVersion.id))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [booksQuery.data, selectedVersion]);

  const groupedBooks = useMemo(() => {
    const groups = new Map<string, BibleBook[]>();

    visibleBooks.forEach((book) => {
      const label = testamentLabel(book.testament);
      groups.set(label, [...(groups.get(label) ?? []), book]);
    });

    return Array.from(groups.entries());
  }, [visibleBooks]);

  const hasError = versionsQuery.isError || booksQuery.isError;
  const error = versionsQuery.error ?? booksQuery.error;
  const selectedVersionLabel = selectedVersion ? versionCode(selectedVersion) : '';

  function selectVersion(version: BibleVersion) {
    setSelectedVersionId(String(version.id));
    setSelectedBookId(null);
    setSelectedChapterId(null);
  }

  function selectBook(book: BibleBook) {
    setSelectedBookId(String(book.id));
    setSelectedChapterId(null);
  }

  function selectChapter(chapter: BibleChapter) {
    setSelectedChapterId(String(chapter.id));
  }

  function goBackOneLevel() {
    if (selectedChapterId) {
      setSelectedChapterId(null);
      return;
    }

    if (selectedBookId) {
      setSelectedBookId(null);
      return;
    }

    setSelectedVersionId(null);
  }

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
        <ScreenTitle icon="bible" text={selectedChapter ? `${selectedBook?.name} ${selectedChapter.number}` : 'Biblia'} />
        <Text style={styles.muted}>
          {selectedChapter
            ? `${selectedVersionLabel} · ${selectedChapter.verses.length} versiculos`
            : selectedBook
              ? 'Elegi un capitulo para comenzar la lectura.'
              : selectedVersion
                ? 'Elegi un libro para ver sus capitulos.'
                : 'Elegi una version para comenzar la lectura.'}
        </Text>
      </View>

      {selectedVersion ? (
        <Pressable style={styles.backButton} onPress={goBackOneLevel}>
          <ArrowLeft color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.backButtonText}>
            {selectedChapter ? 'Volver a capitulos' : selectedBook ? 'Volver a libros' : 'Cambiar Biblia'}
          </Text>
        </Pressable>
      ) : null}

      {!selectedVersion ? (
        <VersionList versions={versionsQuery.data ?? []} onSelect={selectVersion} />
      ) : selectedBook && selectedChapter ? (
        <ChapterReader
          book={selectedBook}
          chapter={selectedChapter}
          nextChapter={nextChapter ?? null}
          onSelectChapter={selectChapter}
          previousChapter={previousChapter ?? null}
          version={selectedVersion}
        />
      ) : selectedBook ? (
        <ChapterList
          book={selectedBook}
          chapters={chaptersQuery.data ?? []}
          error={chaptersQuery.error}
          isError={chaptersQuery.isError}
          isLoading={chaptersQuery.isLoading}
          onRetry={() => chaptersQuery.refetch()}
          onSelect={selectChapter}
          version={selectedVersion}
        />
      ) : (
        <BookList groupedBooks={groupedBooks} onSelect={selectBook} selectedVersion={selectedVersion} />
      )}
    </ScrollView>
  );
}

function VersionList({ versions, onSelect }: { versions: BibleVersion[]; onSelect: (version: BibleVersion) => void }) {
  return (
    <View style={styles.section}>
      <ScreenTitle icon="bible" size="medium" text="Versiones disponibles" />
      {versions.map((version) => (
        <Pressable key={String(version.id)} style={styles.versionCard} onPress={() => onSelect(version)}>
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
          <ChevronRight color="#64748b" size={20} strokeWidth={2.2} />
        </Pressable>
      ))}
      {versions.length === 0 ? <Text style={styles.emptyText}>No hay versiones disponibles.</Text> : null}
    </View>
  );
}

function BookList({
  groupedBooks,
  onSelect,
  selectedVersion,
}: {
  groupedBooks: [string, BibleBook[]][];
  onSelect: (book: BibleBook) => void;
  selectedVersion: BibleVersion;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.selectedHeader}>
        <View style={styles.selectedTitleRow}>
          <CheckCircle2 color="#1b6fd7" size={20} strokeWidth={2.2} />
          <Text style={styles.selectedVersionTitle}>{selectedVersion.name ?? versionCode(selectedVersion)}</Text>
        </View>
        <Text style={styles.muted}>Libros disponibles en {versionCode(selectedVersion)}.</Text>
      </View>

      {groupedBooks.map(([label, books]) => (
        <View key={label} style={styles.bookGroup}>
          <TestamentHero booksCount={books.length} label={label} />
          {books.map((book) => (
            <Pressable key={String(book.id)} style={styles.bookRow} onPress={() => onSelect(book)}>
              <View style={styles.bookIcon}>
                <BookMarked color="#1b6fd7" size={19} strokeWidth={2.2} />
              </View>
              <View style={styles.bookContent}>
                <Text style={styles.rowTitle}>{book.name}</Text>
                {book.testament ? <Text style={styles.rowMeta}>{book.testament}</Text> : null}
              </View>
              <ChevronRight color="#64748b" size={20} strokeWidth={2.2} />
            </Pressable>
          ))}
        </View>
      ))}

      {groupedBooks.length === 0 ? <Text style={styles.emptyText}>No hay libros cargados para esta version.</Text> : null}
    </View>
  );
}

function TestamentHero({ booksCount, label }: { booksCount: number; label: string }) {
  const heroImage = testamentHeroImages[label];

  if (!heroImage) {
    return <Text style={styles.groupTitle}>{label}</Text>;
  }

  return (
    <ImageBackground source={heroImage} imageStyle={styles.groupHeroImage} resizeMode="cover" style={styles.groupHero}>
      <View style={styles.groupHeroOverlay}>
        <Text style={styles.groupHeroEyebrow}>{booksCount} libros</Text>
        <Text style={styles.groupHeroTitle}>{label}</Text>
      </View>
    </ImageBackground>
  );
}

function ChapterList({
  book,
  chapters,
  error,
  isError,
  isLoading,
  onRetry,
  onSelect,
  version,
}: {
  book: BibleBook;
  chapters: BibleChapter[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  onSelect: (chapter: BibleChapter) => void;
  version: BibleVersion;
}) {
  if (isLoading) {
    return (
      <View style={styles.centerPanel}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando capitulos...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerPanel}>
        <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={onRetry}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.selectedHeader}>
        <Text style={styles.versionCode}>{versionCode(version)}</Text>
        <Text style={styles.chapterListTitle}>{book.name}</Text>
        <Text style={styles.muted}>{chapters.length} capitulos disponibles.</Text>
      </View>

      <View style={styles.chapterGrid}>
        {chapters.map((chapter) => {
          const visual = chapterVisual(chapter.number);
          const Icon = visual.Icon;

          return (
            <Pressable key={String(chapter.id)} style={styles.chapterCard} onPress={() => onSelect(chapter)}>
              <View style={[styles.chapterImage, { backgroundColor: visual.background }]}>
                <Icon color={visual.color} size={24} strokeWidth={2.1} />
                <Text style={[styles.chapterImageNumber, { color: visual.color }]}>{chapter.number}</Text>
              </View>
              <Text style={styles.chapterTitle}>Capitulo {chapter.number}</Text>
              <Text style={styles.chapterMeta}>{chapter.verses.length} versiculos</Text>
            </Pressable>
          );
        })}
      </View>

      {chapters.length === 0 ? <Text style={styles.emptyText}>No hay capitulos cargados para este libro.</Text> : null}
    </View>
  );
}

function ChapterReader({
  book,
  chapter,
  nextChapter,
  onSelectChapter,
  previousChapter,
  version,
}: {
  book: BibleBook;
  chapter: BibleChapter;
  nextChapter: BibleChapter | null;
  onSelectChapter: (chapter: BibleChapter) => void;
  previousChapter: BibleChapter | null;
  version: BibleVersion;
}) {
  const visual = chapterVisual(chapter.number);
  const Icon = visual.Icon;

  return (
    <View style={styles.section}>
      <View style={styles.readerHero}>
        <View style={[styles.readerImage, { backgroundColor: visual.background }]}>
          <Icon color={visual.color} size={34} strokeWidth={2.1} />
          <Text style={[styles.readerImageNumber, { color: visual.color }]}>{chapter.number}</Text>
        </View>
        <View style={styles.readerHeroText}>
          <Text style={styles.versionCode}>{versionCode(version)}</Text>
          <Text style={styles.readerTitle}>
            {book.name} {chapter.number}
          </Text>
          <Text style={styles.readerMeta}>{chapter.verses.length} versiculos para leer.</Text>
        </View>
      </View>

      <View style={styles.verseList}>
        {chapter.verses.map((verse) => (
          <View key={String(verse.id)} style={styles.verseRow}>
            <View style={styles.verseNumber}>
              <Text style={styles.verseNumberText}>{verse.number}</Text>
            </View>
            <Text style={styles.verseText}>{verse.text}</Text>
          </View>
        ))}
      </View>

      {chapter.verses.length === 0 ? <Text style={styles.emptyText}>No hay versiculos cargados para este capitulo.</Text> : null}

      <View style={styles.chapterNavigation}>
        <Pressable
          accessibilityRole="button"
          disabled={!previousChapter}
          onPress={() => previousChapter && onSelectChapter(previousChapter)}
          style={[styles.chapterNavigationButton, !previousChapter && styles.chapterNavigationButtonDisabled]}
        >
          <ArrowLeft color={previousChapter ? '#12365c' : '#94a3b8'} size={18} strokeWidth={2.2} />
          <View style={styles.chapterNavigationTextBlock}>
            <Text style={[styles.chapterNavigationLabel, !previousChapter && styles.chapterNavigationTextDisabled]}>
              Anterior
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.chapterNavigationTitle, !previousChapter && styles.chapterNavigationTextDisabled]}
            >
              {previousChapter ? `Capitulo ${previousChapter.number}` : 'Inicio del libro'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!nextChapter}
          onPress={() => nextChapter && onSelectChapter(nextChapter)}
          style={[styles.chapterNavigationButton, styles.chapterNavigationButtonNext, !nextChapter && styles.chapterNavigationButtonDisabled]}
        >
          <View style={styles.chapterNavigationTextBlock}>
            <Text style={[styles.chapterNavigationLabel, !nextChapter && styles.chapterNavigationTextDisabled]}>
              Siguiente
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.chapterNavigationTitle, !nextChapter && styles.chapterNavigationTextDisabled]}
            >
              {nextChapter ? `Capitulo ${nextChapter.number}` : 'Fin del libro'}
            </Text>
          </View>
          <ChevronRight color={nextChapter ? '#12365c' : '#94a3b8'} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>
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
  centerPanel: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  container: {
    gap: 16,
    padding: 16,
    paddingBottom: 112,
  },
  header: {
    gap: 6,
  },
  section: {
    gap: 12,
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
    gap: 8,
    padding: 14,
  },
  selectedTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
  },
  selectedVersionTitle: {
    color: '#151922',
    flex: 1,
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    minWidth: 0,
    paddingRight: 28,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '800',
  },
  bookGroup: {
    gap: 8,
  },
  groupHero: {
    borderRadius: 8,
    minHeight: 116,
    overflow: 'hidden',
  },
  groupHeroImage: {
    borderRadius: 8,
  },
  groupHeroOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    gap: 4,
    justifyContent: 'flex-end',
    minHeight: 116,
    padding: 14,
  },
  groupHeroEyebrow: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  groupHeroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  groupTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  bookRow: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  bookIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  bookContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '800',
  },
  rowMeta: {
    color: '#606b7a',
    fontSize: 13,
    marginTop: 4,
  },
  chapterListTitle: {
    color: '#151922',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 10,
    width: '48.5%',
  },
  chapterImage: {
    alignItems: 'center',
    aspectRatio: 1.55,
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chapterImageNumber: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 3,
  },
  chapterTitle: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '900',
  },
  chapterMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  readerHero: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  readerImage: {
    alignItems: 'center',
    borderRadius: 8,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  readerImageNumber: {
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  readerHeroText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  readerTitle: {
    color: '#151922',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
  },
  readerMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  verseList: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  verseRow: {
    borderBottomColor: '#edf1f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  verseNumber: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  verseNumberText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  verseText: {
    color: '#1f2937',
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  chapterNavigation: {
    flexDirection: 'row',
    gap: 10,
  },
  chapterNavigationButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 58,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  chapterNavigationButtonNext: {
    justifyContent: 'flex-end',
  },
  chapterNavigationButtonDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  chapterNavigationTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  chapterNavigationLabel: {
    color: '#1b6fd7',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  chapterNavigationTitle: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  chapterNavigationTextDisabled: {
    color: '#94a3b8',
  },
  muted: {
    color: '#606b7a',
    lineHeight: 20,
  },
  emptyText: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    color: '#606b7a',
    lineHeight: 20,
    padding: 14,
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

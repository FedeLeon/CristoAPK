import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../src/api/client';
import { getDashboard } from '../../src/api/dashboard';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { DashboardAnnouncement } from '../../src/types/api';

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export default function AnnouncementsScreen() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  if (dashboardQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando anuncios...</Text>
      </View>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="announcements" text="No se pudieron cargar los anuncios" />
        <Text style={styles.error}>{getApiErrorMessage(dashboardQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => dashboardQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const announcements = dashboardQuery.data?.announcements.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ScreenTitle icon="announcements" text="Anuncios" />
          <Text style={styles.muted}>Todos los anuncios activos para tu usuario.</Text>
        </View>
      </View>

      {announcements.length ? (
        <View style={styles.list}>
          {announcements.map((announcement) => (
            <AnnouncementListItem announcement={announcement} key={announcement.id} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <ScreenTitle icon="announcements" size="medium" text="Sin anuncios activos" />
          <Text style={styles.muted}>No hay avisos disponibles por el momento.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function AnnouncementListItem({ announcement }: { announcement: DashboardAnnouncement }) {
  const date = formatDate(announcement.created_at);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/anuncios/${announcement.id}`)}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>{announcement.title}</Text>
        <Text style={[styles.statusPill, announcement.is_read ? styles.statusPillRead : styles.statusPillNew]}>
          {announcement.is_read ? 'Leido' : 'Nuevo'}
        </Text>
      </View>
      <Text style={styles.meta}>
        {announcement.source_name} - {announcement.audience_label}
        {date ? ` - ${date}` : ''}
      </Text>
      {announcement.image_url ? <Image source={{ uri: announcement.image_url }} style={styles.image} /> : null}
      <Text numberOfLines={3} style={styles.body}>
        {announcement.body}
      </Text>
      <View style={styles.openRow}>
        <Text style={styles.openText}>Abrir anuncio</Text>
        <ChevronRight color="#1b6fd7" size={18} strokeWidth={2.4} />
      </View>
    </Pressable>
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
    gap: 14,
    padding: 16,
    paddingBottom: 112,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: '#151922',
    fontSize: 26,
    fontWeight: '900',
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
  list: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 9,
    padding: 14,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: '#151922',
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  statusPill: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillNew: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
  },
  statusPillRead: {
    backgroundColor: '#e8f1ff',
    color: '#1b4f91',
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  image: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 142,
    width: '100%',
  },
  body: {
    color: '#42526a',
    fontSize: 14,
    lineHeight: 21,
  },
  openRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  openText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
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

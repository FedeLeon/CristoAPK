import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../src/api/client';
import { getDashboard, markDashboardAnnouncementRead } from '../../src/api/dashboard';
import { ScreenTitle } from '../../src/components/ScreenTitle';

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const autoMarkedAnnouncementId = useRef<number | null>(null);
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
  const markReadMutation = useMutation({
    mutationFn: markDashboardAnnouncementRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const announcement = dashboardQuery.data?.announcements.data.find((item) => String(item.id) === String(id));

  useEffect(() => {
    if (!announcement || announcement.is_read || autoMarkedAnnouncementId.current === announcement.id) {
      return;
    }

    autoMarkedAnnouncementId.current = announcement.id;
    markReadMutation.mutate(announcement.id);
  }, [announcement, markReadMutation]);

  if (dashboardQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando anuncio...</Text>
      </View>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="announcements" text="No se pudo cargar el anuncio" />
        <Text style={styles.error}>{getApiErrorMessage(dashboardQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => dashboardQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="announcements" text="Anuncio no disponible" />
        <Text style={styles.muted}>Este anuncio ya no esta activo o no corresponde a tu usuario.</Text>
      </View>
    );
  }

  const createdAt = formatDate(announcement.created_at);
  const startsAt = formatDate(announcement.starts_at);
  const endsAt = formatDate(announcement.ends_at);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.titleRow}>
          <ScreenTitle icon="announcements" text={announcement.title} />
          <Text style={[styles.statusPill, announcement.is_read ? styles.statusPillRead : styles.statusPillNew]}>
            {announcement.is_read ? 'Leido' : 'Nuevo'}
          </Text>
        </View>
        <Text style={styles.meta}>
          {announcement.source_name} - {announcement.audience_label}
          {createdAt ? ` - ${createdAt}` : ''}
        </Text>
      </View>

      {announcement.image_url ? <Image source={{ uri: announcement.image_url }} style={styles.image} /> : null}

      <View style={styles.bodyCard}>
        <Text style={styles.body}>{announcement.body}</Text>

        {startsAt || endsAt ? (
          <View style={styles.periodBox}>
            <Text style={styles.periodLabel}>Vigencia</Text>
            <Text style={styles.periodText}>
              {startsAt ? `Desde ${startsAt}` : 'Sin fecha inicial'}
              {endsAt ? ` hasta ${endsAt}` : ''}
            </Text>
          </View>
        ) : null}

        {!announcement.is_read ? (
          <Pressable
            disabled={markReadMutation.isPending}
            style={[styles.primaryButton, markReadMutation.isPending && styles.primaryButtonDisabled]}
            onPress={() => markReadMutation.mutate(announcement.id)}
          >
            <CheckCircle2 color="#ffffff" size={18} strokeWidth={2.2} />
            <Text style={styles.primaryButtonText}>
              {markReadMutation.isPending ? 'Marcando...' : 'Marcar como leido'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
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
  hero: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  title: {
    color: '#151922',
    flex: 1,
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 31,
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
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  image: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 220,
    width: '100%',
  },
  bodyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  body: {
    color: '#2f3947',
    fontSize: 17,
    lineHeight: 27,
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
  periodBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: 12,
  },
  periodLabel: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  periodText: {
    color: '#42526a',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
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

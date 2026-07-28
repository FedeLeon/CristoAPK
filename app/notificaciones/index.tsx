import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../../src/api/client';
import { getNotifications, markNotificationsRead } from '../../src/api/notifications';
import { NotificationListItem } from '../../src/components/NotificationListItem';
import { ScreenTitle } from '../../src/components/ScreenTitle';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (notificationsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando notificaciones...</Text>
      </View>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="notifications" text="No se pudieron cargar las notificaciones" />
        <Text style={styles.error}>{getApiErrorMessage(notificationsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => notificationsQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const notifications = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ScreenTitle icon="notifications" text="Notificaciones" />
          <Text style={styles.muted}>
            {unreadCount > 0 ? `${unreadCount} sin leer.` : 'Todas tus notificaciones estan al dia.'}
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            disabled={markReadMutation.isPending}
            onPress={() => markReadMutation.mutate()}
            style={[styles.readButton, markReadMutation.isPending && styles.readButtonDisabled]}
          >
            <Text style={styles.readButtonText}>{markReadMutation.isPending ? 'Marcando...' : 'Marcar leidas'}</Text>
          </Pressable>
        ) : null}
      </View>

      {notifications.length ? (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationListItem key={notification.id} notification={notification} />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <ScreenTitle icon="notifications" size="medium" text="Sin notificaciones" />
          <Text style={styles.muted}>No hay novedades para mostrar.</Text>
        </View>
      )}
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
  header: {
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
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
    gap: 10,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  readButton: {
    alignItems: 'center',
    backgroundColor: '#12365c',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  readButtonDisabled: {
    opacity: 0.65,
  },
  readButtonText: {
    color: '#ffffff',
    fontSize: 12,
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

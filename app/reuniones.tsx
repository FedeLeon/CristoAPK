import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../src/api/client';
import { getMeetings } from '../src/api/meetings';

function formatMeetingDate(value?: string | null) {
  if (!value) {
    return 'Fecha sin definir';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function MeetingsScreen() {
  const meetingsQuery = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  });

  if (meetingsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando reuniones...</Text>
      </View>
    );
  }

  if (meetingsQuery.isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No se pudieron cargar tus reuniones</Text>
        <Text style={styles.error}>{getApiErrorMessage(meetingsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => meetingsQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis reuniones</Text>
        <Text style={styles.muted}>Reuniones programadas para tu usuario.</Text>
      </View>

      {meetingsQuery.data?.length ? (
        meetingsQuery.data.map((meeting) => (
          <View key={meeting.id} style={styles.card}>
            <Text style={styles.cardTitle}>{meeting.title}</Text>
            <Text style={styles.date}>{formatMeetingDate(meeting.scheduled_for)}</Text>
            {meeting.description ? <Text style={styles.text}>{meeting.description}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.meta}>Duracion: {meeting.duration_minutes ?? 0} min</Text>
              <Text style={styles.meta}>Participantes: {meeting.attendees?.length ?? 0}</Text>
            </View>
            {meeting.teacher?.name ? <Text style={styles.meta}>Tutor: {meeting.teacher.name}</Text> : null}
            {meeting.jitsi_room_url ? (
              <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(meeting.jitsi_room_url!)}>
                <Text style={styles.primaryButtonText}>Entrar a la reunion</Text>
              </Pressable>
            ) : null}
          </View>
        ))
      ) : (
        <View style={styles.empty}>
          <Text style={styles.cardTitle}>Sin reuniones</Text>
          <Text style={styles.muted}>No tenes reuniones programadas por el momento.</Text>
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
    flex: 1,
    gap: 16,
    padding: 24,
  },
  scroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 6,
  },
  title: {
    color: '#151922',
    fontSize: 24,
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
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '800',
  },
  date: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '800',
  },
  text: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    marginTop: 4,
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

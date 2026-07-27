import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiErrorMessage } from '../src/api/client';
import { getMeetings } from '../src/api/meetings';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { Meeting } from '../src/types/api';

const weekdayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function formatMeetingDate(value?: string | null) {
  if (!value) {
    return 'Fecha sin definir';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMeetingTime(value?: string | null) {
  if (!value) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function toDateKey(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const days: Array<{ date?: Date; key: string }> = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    days.push({ key: `empty-start-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    days.push({ date, key: toDateKey(date.toISOString()) });
  }

  const trailingEmptyDays = (7 - (days.length % 7)) % 7;
  for (let index = 0; index < trailingEmptyDays; index += 1) {
    days.push({ key: `empty-end-${index}` });
  }

  return days;
}

export default function MeetingsScreen() {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<number[]>([]);
  const meetingsQuery = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  });

  const meetings = meetingsQuery.data ?? [];
  const meetingsByDate = useMemo(() => {
    return meetings.reduce<Record<string, Meeting[]>>((grouped, meeting) => {
      const key = toDateKey(meeting.scheduled_for);
      if (!key) {
        return grouped;
      }

      grouped[key] = [...(grouped[key] ?? []), meeting];
      return grouped;
    }, {});
  }, [meetings]);
  const selectedMeetings = selectedDateKey ? meetingsByDate[selectedDateKey] ?? [] : [];

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
        <ScreenTitle icon="meetings" text="No se pudieron cargar tus reuniones" />
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
        <ScreenTitle icon="meetings" text="Mis reuniones" />
        <Text style={styles.muted}>Reuniones programadas para tu usuario.</Text>
      </View>

      <MeetingCalendar
        calendarMonth={calendarMonth}
        meetingsByDate={meetingsByDate}
        onChangeMonth={(offset) =>
          setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
        }
        onSelectDate={setSelectedDateKey}
        selectedDateKey={selectedDateKey}
      />

      {selectedDateKey ? (
        <View style={styles.selectedDayBlock}>
          <Text style={styles.selectedDayTitle}>
            {selectedMeetings.length
              ? `${selectedMeetings.length} reunion${selectedMeetings.length === 1 ? '' : 'es'} ese dia`
              : 'Sin reuniones ese dia'}
          </Text>
          <Text style={styles.meta}>{selectedDateKey.split('-').reverse().join('/')}</Text>
        </View>
      ) : null}

      {meetings.length ? (
        meetings.map((meeting) => (
          <MeetingCard
            expanded={expandedMeetingIds.includes(meeting.id)}
            key={meeting.id}
            meeting={meeting}
            onToggle={() =>
              setExpandedMeetingIds((current) =>
                current.includes(meeting.id) ? current.filter((id) => id !== meeting.id) : [...current, meeting.id],
              )
            }
          />
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

function MeetingCalendar({
  calendarMonth,
  meetingsByDate,
  onChangeMonth,
  onSelectDate,
  selectedDateKey,
}: {
  calendarMonth: Date;
  meetingsByDate: Record<string, Meeting[]>;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (dateKey: string) => void;
  selectedDateKey: string | null;
}) {
  const todayKey = toDateKey(new Date().toISOString());
  const days = buildCalendarDays(calendarMonth);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Pressable accessibilityLabel="Mes anterior" onPress={() => onChangeMonth(-1)} style={styles.calendarNavButton}>
          <ChevronLeft color="#1f2937" size={20} strokeWidth={2.4} />
        </Pressable>
        <Text style={styles.calendarTitle}>{formatMonthTitle(calendarMonth)}</Text>
        <Pressable accessibilityLabel="Mes siguiente" onPress={() => onChangeMonth(1)} style={styles.calendarNavButton}>
          <ChevronRight color="#1f2937" size={20} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.calendarGrid}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.calendarWeekday}>
            {label}
          </Text>
        ))}
        {days.map((day) => {
          if (!day.date) {
            return <View key={day.key} style={styles.calendarEmptyDay} />;
          }

          const dateKey = toDateKey(day.date.toISOString());
          const hasMeetings = Boolean(meetingsByDate[dateKey]?.length);
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDateKey;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={dateKey}
              onPress={() => onSelectDate(dateKey)}
              style={[
                styles.calendarDay,
                isToday && styles.calendarDayToday,
                isSelected && styles.calendarDaySelected,
                hasMeetings && styles.calendarDayEvent,
              ]}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  isToday && styles.calendarDayTextToday,
                  isSelected && styles.calendarDayTextSelected,
                ]}
              >
                {day.date.getDate()}
              </Text>
              {hasMeetings ? <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MeetingCard({ expanded, meeting, onToggle }: { expanded: boolean; meeting: Meeting; onToggle: () => void }) {
  const Icon = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{meeting.title}</Text>
          <Text style={styles.date}>
            {formatMeetingDate(meeting.scheduled_for)} · {meeting.duration_minutes ?? 0} min
          </Text>
        </View>
        <Icon color="#64748b" size={21} strokeWidth={2.3} />
      </Pressable>

      {expanded ? (
        <View style={styles.cardDetails}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Tipo: {meeting.meeting_type === 'individual' ? 'Individual' : 'Grupal'}</Text>
            <Text style={styles.meta}>Participantes: {meeting.attendees?.length ?? 0}</Text>
          </View>
          {meeting.teacher?.name ? <Text style={styles.meta}>Tutor: {meeting.teacher.name}</Text> : null}
          {meeting.attendees?.length ? (
            <Text style={styles.meta}>
              Usuarios: {meeting.attendees.map((attendee) => attendee.name).join(', ')}
            </Text>
          ) : null}
          {meeting.description ? <Text style={styles.text}>{meeting.description}</Text> : null}
        </View>
      ) : (
        <Text style={styles.meta}>Inicio: {formatMeetingTime(meeting.scheduled_for)}</Text>
      )}

      {meeting.jitsi_room_url ? (
        <Pressable style={styles.primaryButton} onPress={() => router.push(`/reuniones/${meeting.id}`)}>
          <Text style={styles.primaryButtonText}>Entrar a la reunion</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  calendarDay: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 6,
    position: 'relative',
    width: '12.5%',
  },
  calendarDayEvent: {
    borderColor: '#86efac',
  },
  calendarDaySelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#1b6fd7',
  },
  calendarDayText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  calendarDayTextSelected: {
    color: '#1b6fd7',
  },
  calendarDayTextToday: {
    color: '#ffffff',
  },
  calendarDayToday: {
    backgroundColor: '#1b6fd7',
  },
  calendarEmptyDay: {
    height: 42,
    width: '12.5%',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarNavButton: {
    alignItems: 'center',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarTitle: {
    color: '#151922',
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calendarWeekday: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: '12.5%',
  },
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
  cardDetails: {
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    gap: 9,
    paddingTop: 10,
  },
  cardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 48,
  },
  cardHeaderText: {
    flex: 1,
    gap: 5,
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
  eventDot: {
    backgroundColor: '#16a34a',
    borderRadius: 3,
    bottom: 5,
    height: 6,
    position: 'absolute',
    width: 6,
  },
  eventDotSelected: {
    backgroundColor: '#1b6fd7',
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
  selectedDayBlock: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: 12,
  },
  selectedDayTitle: {
    color: '#151922',
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

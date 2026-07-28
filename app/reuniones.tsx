import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { createMeeting, getMeetingCandidates, getMeetings, MeetingCreateInput } from '../src/api/meetings';
import { AppModal } from '../src/components/AppModal';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { ApiUser, Meeting } from '../src/types/api';

const weekdayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

type MeetingForm = {
  date: string;
  description: string;
  duration_minutes: string;
  meeting_type: 'group' | 'individual';
  participant_ids: number[];
  time: string;
  title: string;
};

const emptyMeetingForm: MeetingForm = {
  date: '',
  description: '',
  duration_minutes: '60',
  meeting_type: 'individual',
  participant_ids: [],
  time: '',
  title: '',
};

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
  const queryClient = useQueryClient();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [expandedMeetingIds, setExpandedMeetingIds] = useState<number[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>(emptyMeetingForm);
  const [formError, setFormError] = useState<string | null>(null);
  const meetingsQuery = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  });
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });
  const canCreateMeetings =
    meQuery.data?.role === 'admin' ||
    meQuery.data?.role === 'superadmin' ||
    meQuery.data?.role === 'tutor' ||
    meQuery.data?.role === 'pastor';
  const candidatesQuery = useQuery({
    queryKey: ['meeting-candidates'],
    queryFn: getMeetingCandidates,
    enabled: isCreateModalOpen && canCreateMeetings,
  });
  const createMeetingMutation = useMutation({
    mutationFn: createMeeting,
    onSuccess: async (meeting) => {
      setIsCreateModalOpen(false);
      setMeetingForm(emptyMeetingForm);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['meetings'] });
      router.push(`/reuniones/${meeting.id}`);
    },
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

  function updateMeetingForm(field: keyof MeetingForm, value: MeetingForm[keyof MeetingForm]) {
    setFormError(null);
    setMeetingForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'meeting_type' && value === 'individual' && next.participant_ids.length > 1) {
        next.participant_ids = next.participant_ids.slice(0, 1);
      }

      return next;
    });
  }

  function toggleParticipant(userId: number) {
    setFormError(null);
    setMeetingForm((current) => {
      const selected = current.participant_ids.includes(userId);

      if (selected) {
        return {
          ...current,
          participant_ids: current.participant_ids.filter((id) => id !== userId),
        };
      }

      return {
        ...current,
        participant_ids: current.meeting_type === 'individual' ? [userId] : [...current.participant_ids, userId],
      };
    });
  }

  function submitMeeting() {
    const duration = Number(meetingForm.duration_minutes);

    if (!meetingForm.title.trim() || !meetingForm.date.trim() || !meetingForm.time.trim()) {
      setFormError('Completa titulo, fecha y hora.');
      return;
    }

    if (!Number.isFinite(duration) || duration < 15) {
      setFormError('La duracion minima es 15 minutos.');
      return;
    }

    if (!meetingForm.participant_ids.length) {
      setFormError('Selecciona al menos un participante.');
      return;
    }

    const payload: MeetingCreateInput = {
      description: meetingForm.description.trim() || undefined,
      duration_minutes: duration,
      meeting_type: meetingForm.meeting_type,
      participant_ids: meetingForm.participant_ids,
      scheduled_for: `${meetingForm.date.trim()}T${meetingForm.time.trim()}:00`,
      title: meetingForm.title.trim(),
    };

    createMeetingMutation.mutate(payload);
  }

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
    <>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerTitleText}>
              <ScreenTitle icon="meetings" text="Mis reuniones" />
              <Text style={styles.muted}>Reuniones programadas para tu usuario.</Text>
            </View>
            {canCreateMeetings ? (
              <Pressable accessibilityRole="button" onPress={() => setIsCreateModalOpen(true)} style={styles.newMeetingButton}>
                <CalendarPlus color="#ffffff" size={19} strokeWidth={2.3} />
                <Text style={styles.newMeetingButtonText}>Nueva</Text>
              </Pressable>
            ) : null}
          </View>
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
      <CreateMeetingModal
        candidates={candidatesQuery.data ?? []}
        error={formError ?? (createMeetingMutation.error ? getApiErrorMessage(createMeetingMutation.error) : null)}
        form={meetingForm}
        isLoading={candidatesQuery.isLoading}
        isSaving={createMeetingMutation.isPending}
        onChange={updateMeetingForm}
        onClose={() => {
          setIsCreateModalOpen(false);
          setMeetingForm(emptyMeetingForm);
          setFormError(null);
        }}
        onRetry={() => candidatesQuery.refetch()}
        onSubmit={submitMeeting}
        onToggleParticipant={toggleParticipant}
        participantsError={candidatesQuery.error ? getApiErrorMessage(candidatesQuery.error) : null}
        visible={isCreateModalOpen}
      />
    </>
  );
}

function roleLabel(role?: string | null) {
  if (role === 'admin' || role === 'superadmin') {
    return 'Admin';
  }

  if (role === 'tutor') {
    return 'Tutor';
  }

  if (role === 'pastor') {
    return 'Pastor';
  }

  return 'Usuario';
}

function CreateMeetingModal({
  candidates,
  error,
  form,
  isLoading,
  isSaving,
  onChange,
  onClose,
  onRetry,
  onSubmit,
  onToggleParticipant,
  participantsError,
  visible,
}: {
  candidates: ApiUser[];
  error: string | null;
  form: MeetingForm;
  isLoading: boolean;
  isSaving: boolean;
  onChange: (field: keyof MeetingForm, value: MeetingForm[keyof MeetingForm]) => void;
  onClose: () => void;
  onRetry: () => void;
  onSubmit: () => void;
  onToggleParticipant: (userId: number) => void;
  participantsError: string | null;
  visible: boolean;
}) {
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const selectedParticipants = candidates.filter((candidate) => form.participant_ids.includes(candidate.id));

  return (
    <>
      <AppModal contentStyle={styles.createModal} onClose={onClose} transition="slide-up" visible={visible}>
        <View style={styles.createModalHeader}>
          <ScreenTitle icon="meetings" size="medium" text="Nueva reunion" />
          <Text style={styles.muted}>Programa una reunion y selecciona los participantes habilitados.</Text>
        </View>

        <ScrollView contentContainerStyle={styles.createForm} keyboardShouldPersistTaps="handled">
          <MeetingInput label="Titulo" onChangeText={(value) => onChange('title', value)} value={form.title} />
          <MeetingInput
            label="Descripcion"
            multiline
            onChangeText={(value) => onChange('description', value)}
            value={form.description}
          />

          <View style={styles.formRow}>
            <MeetingInput label="Fecha" onChangeText={(value) => onChange('date', value)} placeholder="AAAA-MM-DD" value={form.date} />
            <MeetingInput label="Hora" onChangeText={(value) => onChange('time', value)} placeholder="HH:MM" value={form.time} />
          </View>

          <MeetingInput
            keyboardType="number-pad"
            label="Duracion"
            onChangeText={(value) => onChange('duration_minutes', value.replace(/\D/g, '').slice(0, 3))}
            placeholder="60"
            value={form.duration_minutes}
          />

          <View style={styles.segmentedControl}>
            {[
              { label: 'Individual', value: 'individual' as const },
              { label: 'Grupal', value: 'group' as const },
            ].map((option) => {
              const selected = form.meeting_type === option.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onChange('meeting_type', option.value)}
                  style={[styles.segmentedOption, selected && styles.segmentedOptionActive]}
                >
                  <Text style={[styles.segmentedOptionText, selected && styles.segmentedOptionTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.participantBlock}>
            <Text style={styles.fieldLabel}>Participantes</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsParticipantsModalOpen(true)}
              style={styles.loadParticipantsButton}
            >
              <CalendarPlus color="#12365c" size={18} strokeWidth={2.3} />
              <Text style={styles.loadParticipantsButtonText}>Cargar participantes</Text>
            </Pressable>
            <View style={styles.selectedParticipantsBox}>
              <Text style={styles.selectedParticipantsText}>
                {selectedParticipants.length
                  ? `${selectedParticipants.length} participante${selectedParticipants.length === 1 ? '' : 's'} seleccionado${selectedParticipants.length === 1 ? '' : 's'}`
                  : 'Todavia no seleccionaste participantes.'}
              </Text>
              {selectedParticipants.length ? (
                <Text numberOfLines={2} style={styles.selectedParticipantsNames}>
                  {selectedParticipants.map((participant) => participant.name).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={onSubmit}
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          >
            {isSaving ? <ActivityIndicator color="#ffffff" /> : <CalendarPlus color="#ffffff" size={18} strokeWidth={2.3} />}
            <Text style={styles.primaryButtonText}>{isSaving ? 'Creando...' : 'Crear reunion'}</Text>
          </Pressable>
        </ScrollView>
      </AppModal>

      <ParticipantsPickerModal
        candidates={candidates}
        error={participantsError}
        form={form}
        isLoading={isLoading}
        onClose={() => setIsParticipantsModalOpen(false)}
        onRetry={onRetry}
        onToggleParticipant={onToggleParticipant}
        visible={visible && isParticipantsModalOpen}
      />
    </>
  );
}

function ParticipantsPickerModal({
  candidates,
  error,
  form,
  isLoading,
  onClose,
  onRetry,
  onToggleParticipant,
  visible,
}: {
  candidates: ApiUser[];
  error: string | null;
  form: MeetingForm;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onToggleParticipant: (userId: number) => void;
  visible: boolean;
}) {
  return (
    <AppModal contentStyle={styles.participantsModal} onClose={onClose} transition="slide-up" visible={visible}>
      <View style={styles.createModalHeader}>
        <ScreenTitle icon="meetings" size="medium" text="Participantes" />
        <Text style={styles.muted}>
          {form.meeting_type === 'individual' ? 'Elegí una persona para la reunión individual.' : 'Elegí una o más personas para la reunión grupal.'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.modalCenter}>
          <ActivityIndicator />
          <Text style={styles.muted}>Cargando participantes...</Text>
        </View>
      ) : error ? (
        <View style={styles.modalCenter}>
          <Text style={styles.error}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : candidates.length ? (
        <ScrollView contentContainerStyle={styles.participantList} keyboardShouldPersistTaps="handled">
          {candidates.map((candidate) => {
            const selected = form.participant_ids.includes(candidate.id);

            return (
              <Pressable
                accessibilityRole="button"
                key={candidate.id}
                onPress={() => onToggleParticipant(candidate.id)}
                style={[styles.participantCard, selected && styles.participantCardSelected]}
              >
                <View style={[styles.participantAvatar, { backgroundColor: candidate.avatar_color ?? '#12365c' }]}>
                  <Text style={styles.participantAvatarText}>{candidate.avatar_initials || candidate.name.charAt(0)}</Text>
                </View>
                <View style={styles.participantContent}>
                  <Text numberOfLines={1} style={styles.participantName}>{candidate.name}</Text>
                  <Text numberOfLines={1} style={styles.participantEmail}>{candidate.email}</Text>
                </View>
                <Text style={styles.rolePill}>{roleLabel(candidate.role)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>No hay participantes disponibles para tu rol.</Text>
      )}

      <Pressable accessibilityRole="button" onPress={onClose} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Listo</Text>
      </Pressable>
    </AppModal>
  );
}

function MeetingInput({
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  placeholder,
  value,
}: {
  keyboardType?: 'default' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline && styles.textArea]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
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
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitleText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  newMeetingButton: {
    alignItems: 'center',
    backgroundColor: '#12365c',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newMeetingButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
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
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.64,
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
  createModal: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxHeight: '88%',
    maxWidth: 560,
    padding: 16,
    width: '100%',
  },
  participantsModal: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxHeight: '86%',
    maxWidth: 560,
    padding: 16,
    width: '100%',
  },
  createModalHeader: {
    gap: 6,
  },
  createForm: {
    gap: 12,
    paddingBottom: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textArea: {
    minHeight: 86,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentedControl: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 4,
  },
  segmentedOption: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmentedOptionActive: {
    backgroundColor: '#12365c',
  },
  segmentedOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  segmentedOptionTextActive: {
    color: '#ffffff',
  },
  participantBlock: {
    gap: 8,
  },
  loadParticipantsButton: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderColor: '#b8d7ff',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loadParticipantsButtonText: {
    color: '#12365c',
    fontSize: 14,
    fontWeight: '900',
  },
  selectedParticipantsBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  selectedParticipantsText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  selectedParticipantsNames: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  modalCenter: {
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  participantList: {
    gap: 8,
  },
  participantCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 62,
    padding: 10,
  },
  participantCardSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#1b6fd7',
  },
  participantAvatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  participantAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  participantContent: {
    flex: 1,
    minWidth: 0,
  },
  participantName: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  participantEmail: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rolePill: {
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    color: '#12365c',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  emptyText: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    color: '#64748b',
    lineHeight: 20,
    padding: 12,
  },
});

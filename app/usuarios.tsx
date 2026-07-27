import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  BarChart3,
  Check,
  CircleUserRound,
  ClipboardEdit,
  HeartPulse,
  Lock,
  Plus,
  RefreshCcw,
  Trash2,
  Unlock,
  UserCog,
  UsersRound,
} from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import {
  createTutorGroup,
  createTutorStudent,
  deleteTutorGroup,
  deleteTutorStudent,
  updateTutorGroup,
  updateTutorGroupStudents,
  updateTutorStudentStatus,
  type CreateTutorGroupInput,
} from '../src/api/tutorUsers';
import { getTutorUsers } from '../src/api/tutorUsers';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { TutorGroup, TutorStudent } from '../src/types/api';

type ActiveTab = 'students' | 'groups';
type StudentDetailMode = 'actions' | 'pastoral' | 'progress' | 'ficha' | 'profile';
type GroupFormState = CreateTutorGroupInput & { id?: number };

const dayOptions = [
  { label: 'Lun', value: 'monday' },
  { label: 'Mar', value: 'tuesday' },
  { label: 'Mie', value: 'wednesday' },
  { label: 'Jue', value: 'thursday' },
  { label: 'Vie', value: 'friday' },
  { label: 'Sab', value: 'saturday' },
  { label: 'Dom', value: 'sunday' },
];

const modalityOptions: Array<CreateTutorGroupInput['modality']> = ['presencial', 'virtual'];
const statusOptions: Array<CreateTutorGroupInput['status']> = ['activo', 'pausado', 'terminado'];

const emptyStudentForm = {
  email: '',
  last_name: '',
  name: '',
  password: '',
};

const emptyGroupForm: GroupFormState = {
  description: '',
  meeting_days: ['monday'],
  meeting_time: '19:00',
  modality: 'presencial',
  name: '',
  start_date: new Date().toISOString().slice(0, 10),
  status: 'activo',
  students: [],
};

export default function TutorUsersScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>(params.tab === 'groups' ? 'groups' : 'students');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [assignmentGroup, setAssignmentGroup] = useState<TutorGroup | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);
  const [studentDetailMode, setStudentDetailMode] = useState<StudentDetailMode>('actions');
  const [studentForm, setStudentForm] = useState(emptyStudentForm);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [assignmentStudentIds, setAssignmentStudentIds] = useState<number[]>([]);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  const usersQuery = useQuery({
    queryKey: ['tutor-users'],
    queryFn: getTutorUsers,
    enabled: meQuery.data?.role === 'tutor',
  });

  const refreshTutorUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tutor-users'] });
  };

  const createStudentMutation = useMutation({
    mutationFn: createTutorStudent,
    onSuccess: async () => {
      setStudentModalOpen(false);
      setStudentForm(emptyStudentForm);
      await refreshTutorUsers();
    },
  });

  const updateStudentStatusMutation = useMutation({
    mutationFn: updateTutorStudentStatus,
    onSuccess: refreshTutorUsers,
  });

  const deleteStudentMutation = useMutation({
    mutationFn: deleteTutorStudent,
    onSuccess: refreshTutorUsers,
  });

  const saveGroupMutation = useMutation({
    mutationFn: (input: GroupFormState) => (input.id ? updateTutorGroup({ ...input, id: input.id }) : createTutorGroup(input)),
    onSuccess: async () => {
      setGroupModalOpen(false);
      setGroupForm(emptyGroupForm);
      await refreshTutorUsers();
    },
  });

  const updateGroupStudentsMutation = useMutation({
    mutationFn: updateTutorGroupStudents,
    onSuccess: async () => {
      setAssignmentGroup(null);
      setAssignmentStudentIds([]);
      await refreshTutorUsers();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteTutorGroup,
    onSuccess: refreshTutorUsers,
  });

  const students = usersQuery.data?.students ?? [];
  const groups = usersQuery.data?.groups ?? [];

  useEffect(() => {
    if (params.tab === 'groups') {
      setActiveTab('groups');
      return;
    }

    if (params.tab === 'students') {
      setActiveTab('students');
    }
  }, [params.tab]);

  if (meQuery.isLoading) {
    return <CenteredState text="Cargando sesion..." />;
  }

  if (meQuery.data?.role !== 'tutor') {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="users" text="Usuarios" />
        <Text style={styles.error}>Esta seccion esta disponible solo para tutores.</Text>
      </View>
    );
  }

  if (usersQuery.isLoading) {
    return <CenteredState text="Cargando usuarios..." />;
  }

  if (usersQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="users" text="No se pudo cargar usuarios" />
        <Text style={styles.error}>{getApiErrorMessage(usersQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => usersQuery.refetch()}>
          <RefreshCcw color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={usersQuery.isRefetching} onRefresh={usersQuery.refetch} />}
      >
        <View style={styles.header}>
          <ScreenTitle icon="users" text="Usuarios" />
          <Text style={styles.muted}>Usuarios a cargo y grupos gestionados por tu rol de tutor.</Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'students' }}
            onPress={() => setActiveTab('students')}
            style={[styles.tab, activeTab === 'students' && styles.tabActive]}
          >
            <UserCog color={activeTab === 'students' ? '#1b6fd7' : '#64748b'} size={18} strokeWidth={2.2} />
          <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>Listado de usuarios</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'groups' }}
            onPress={() => setActiveTab('groups')}
            style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          >
            <UsersRound color={activeTab === 'groups' ? '#1b6fd7' : '#64748b'} size={18} strokeWidth={2.2} />
            <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Grupos</Text>
          </Pressable>
        </View>

        {activeTab === 'students' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Usuarios a cargo</Text>
              <Pressable style={styles.iconButton} onPress={() => setStudentModalOpen(true)}>
                <Plus color="#ffffff" size={18} strokeWidth={2.4} />
              </Pressable>
            </View>
            {students.length ? (
              students.map((student) => (
                <StudentCard
                  key={student.id}
                  onOpen={() => {
                    setSelectedStudent(student);
                    setStudentDetailMode('actions');
                  }}
                  student={student}
                />
              ))
            ) : (
              <EmptyCard title="Sin usuarios" text="Todavia no tenes usuarios asignados." />
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Grupos</Text>
              <Pressable
                style={styles.iconButton}
                onPress={() => {
                  setGroupForm(emptyGroupForm);
                  setGroupModalOpen(true);
                }}
              >
                <Plus color="#ffffff" size={18} strokeWidth={2.4} />
              </Pressable>
            </View>
            {groups.length ? (
              groups.map((group) => (
                <GroupCard
                  key={group.id}
                  deleting={deleteGroupMutation.isPending}
                  group={group}
                  onAssign={() => {
                    setAssignmentGroup(group);
                    setAssignmentStudentIds(group.students?.map((student) => student.student_id) ?? []);
                  }}
                  onDelete={() => confirmDeleteGroup(group, deleteGroupMutation.mutate)}
                  onEdit={() => {
                    setGroupForm({
                      description: group.description ?? '',
                      id: group.id,
                      meeting_days: group.meeting_days?.length ? group.meeting_days : ['monday'],
                      meeting_time: group.meeting_time ?? '19:00',
                      modality: (group.modality as CreateTutorGroupInput['modality']) || 'presencial',
                      name: group.name,
                      start_date: group.start_date ?? new Date().toISOString().slice(0, 10),
                      status: (group.status as CreateTutorGroupInput['status']) || 'activo',
                      students: group.students?.map((student) => student.student_id) ?? [],
                    });
                    setGroupModalOpen(true);
                  }}
                />
              ))
            ) : (
              <EmptyCard title="Sin grupos" text="Crea grupos para organizar tus usuarios." />
            )}
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={studentModalOpen} onRequestClose={() => setStudentModalOpen(false)}>
        <View style={styles.centeredModalBackdrop}>
          <View style={styles.centeredModalCard}>
            <Text style={styles.modalTitle}>Nuevo usuario</Text>
            <Field label="Nombre" value={studentForm.name} onChangeText={(name) => setStudentForm({ ...studentForm, name })} />
            <Field
              label="Apellido"
              value={studentForm.last_name}
              onChangeText={(last_name) => setStudentForm({ ...studentForm, last_name })}
            />
            <Field
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              value={studentForm.email}
              onChangeText={(email) => setStudentForm({ ...studentForm, email })}
            />
            <Field
              label="Contrasena"
              secureTextEntry
              value={studentForm.password}
              onChangeText={(password) => setStudentForm({ ...studentForm, password })}
            />
            {createStudentMutation.isError ? (
              <Text style={styles.error}>{getApiErrorMessage(createStudentMutation.error)}</Text>
            ) : null}
            <ModalActions
              busy={createStudentMutation.isPending}
              onCancel={() => setStudentModalOpen(false)}
              onSave={() => createStudentMutation.mutate(studentForm)}
              saveLabel="Crear"
            />
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={groupModalOpen} onRequestClose={() => setGroupModalOpen(false)}>
        <View style={styles.centeredModalBackdrop}>
          <ScrollView contentContainerStyle={styles.centeredModalCard} style={styles.centeredModalScroll}>
            <Text style={styles.modalTitle}>{groupForm.id ? 'Editar grupo' : 'Nuevo grupo'}</Text>
            <Field label="Nombre" value={groupForm.name} onChangeText={(name) => setGroupForm({ ...groupForm, name })} />
            <Field
              label="Descripcion"
              multiline
              value={groupForm.description ?? ''}
              onChangeText={(description) => setGroupForm({ ...groupForm, description })}
            />
            <Field
              label="Fecha de inicio"
              value={groupForm.start_date}
              onChangeText={(start_date) => setGroupForm({ ...groupForm, start_date })}
            />
            <Field
              label="Horario"
              value={groupForm.meeting_time}
              onChangeText={(meeting_time) => setGroupForm({ ...groupForm, meeting_time })}
            />
            <Text style={styles.inputLabel}>Dias</Text>
            <View style={styles.choiceWrap}>
              {dayOptions.map((day) => {
                const selected = groupForm.meeting_days.includes(day.value);
                return (
                  <Choice
                    key={day.value}
                    label={day.label}
                    selected={selected}
                    onPress={() =>
                      setGroupForm({
                        ...groupForm,
                        meeting_days: selected
                          ? groupForm.meeting_days.filter((value) => value !== day.value)
                          : [...groupForm.meeting_days, day.value],
                      })
                    }
                  />
                );
              })}
            </View>
            <Text style={styles.inputLabel}>Modalidad</Text>
            <View style={styles.choiceWrap}>
              {modalityOptions.map((modality) => (
                <Choice
                  key={modality}
                  label={modality}
                  selected={groupForm.modality === modality}
                  onPress={() => setGroupForm({ ...groupForm, modality })}
                />
              ))}
            </View>
            <Text style={styles.inputLabel}>Estado</Text>
            <View style={styles.choiceWrap}>
              {statusOptions.map((status) => (
                <Choice
                  key={status}
                  label={status}
                  selected={groupForm.status === status}
                  onPress={() => setGroupForm({ ...groupForm, status })}
                />
              ))}
            </View>
            {saveGroupMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(saveGroupMutation.error)}</Text> : null}
            <ModalActions
              busy={saveGroupMutation.isPending}
              onCancel={() => setGroupModalOpen(false)}
              onSave={() => saveGroupMutation.mutate(groupForm)}
              saveLabel="Guardar"
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={Boolean(assignmentGroup)} onRequestClose={() => setAssignmentGroup(null)}>
        <View style={styles.centeredModalBackdrop}>
          <ScrollView contentContainerStyle={styles.centeredModalCard} style={styles.centeredModalScroll}>
            <Text style={styles.modalTitle}>Asignar usuarios</Text>
            <Text style={styles.muted}>{assignmentGroup?.name}</Text>
            {students.length ? (
              students.map((student) => {
                const selected = assignmentStudentIds.includes(student.student_id);
                return (
                  <Pressable
                    key={student.id}
                    style={[styles.assignmentRow, selected && styles.assignmentRowSelected]}
                    onPress={() =>
                      setAssignmentStudentIds((current) =>
                        current.includes(student.student_id)
                          ? current.filter((id) => id !== student.student_id)
                          : [...current, student.student_id],
                      )
                    }
                  >
                    <View style={[styles.checkBox, selected && styles.checkBoxSelected]}>
                      {selected ? <Check color="#ffffff" size={14} strokeWidth={2.8} /> : null}
                    </View>
                    <View style={styles.assignmentText}>
                      <Text style={styles.cardTitle}>{student.name}</Text>
                      <Text style={styles.meta}>{student.email}</Text>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.muted}>No hay usuarios para asignar.</Text>
            )}
            {updateGroupStudentsMutation.isError ? (
              <Text style={styles.error}>{getApiErrorMessage(updateGroupStudentsMutation.error)}</Text>
            ) : null}
            <ModalActions
              busy={updateGroupStudentsMutation.isPending}
              onCancel={() => setAssignmentGroup(null)}
              onSave={() =>
                assignmentGroup &&
                updateGroupStudentsMutation.mutate({
                  id: assignmentGroup.id,
                  students: assignmentStudentIds,
                })
              }
              saveLabel="Asignar"
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(selectedStudent)}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View style={styles.centeredModalBackdrop}>
          <ScrollView contentContainerStyle={styles.studentActionCard} style={styles.centeredModalScroll}>
            {selectedStudent ? (
              <StudentActionModal
                busy={updateStudentStatusMutation.isPending || deleteStudentMutation.isPending}
                mode={studentDetailMode}
                onBack={() => setStudentDetailMode('actions')}
                onClose={() => setSelectedStudent(null)}
                onDelete={() =>
                  confirmDeleteStudent(selectedStudent, (id) => {
                    setSelectedStudent(null);
                    deleteStudentMutation.mutate(id);
                  })
                }
                onModeChange={setStudentDetailMode}
                onToggleStatus={() =>
                  confirmToggleStudentStatus(selectedStudent, (id, status) => {
                    setSelectedStudent(null);
                    updateStudentStatusMutation.mutate({ id, status });
                  })
                }
                student={selectedStudent}
              />
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function StudentCard({
  onOpen,
  student,
}: {
  onOpen: () => void;
  student: TutorStudent;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: student.avatar_color ?? '#1b6fd7' }]}>
          <Text style={styles.avatarText}>{student.avatar_initials ?? student.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{student.name}</Text>
          <Text style={styles.meta}>{student.email}</Text>
        </View>
        <StatusBadge value={student.status ?? 'activo'} />
      </View>
      <View style={styles.metaWrap}>
        <Text style={styles.meta}>Grupos: {student.groups?.length ? student.groups.join(', ') : 'Sin grupo'}</Text>
        {student.city ? <Text style={styles.meta}>Ciudad: {student.city}</Text> : null}
        {student.phone ? <Text style={styles.meta}>Telefono: {student.phone}</Text> : null}
      </View>
      <Text style={styles.cardHint}>Toca para ver acciones</Text>
    </Pressable>
  );
}

function StudentActionModal({
  busy,
  mode,
  onBack,
  onClose,
  onDelete,
  onModeChange,
  onToggleStatus,
  student,
}: {
  busy: boolean;
  mode: StudentDetailMode;
  onBack: () => void;
  onClose: () => void;
  onDelete: () => void;
  onModeChange: (mode: StudentDetailMode) => void;
  onToggleStatus: () => void;
  student: TutorStudent;
}) {
  const blocked = student.status === 'bloqueado';

  if (mode !== 'actions') {
    return (
      <>
        <View style={styles.modalHeaderRow}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.smallLinkButton}>
            <Text style={styles.smallLinkButtonText}>Acciones</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.smallLinkButton}>
            <Text style={styles.smallLinkButtonText}>Cerrar</Text>
          </Pressable>
        </View>
        {mode === 'pastoral' ? <PastoralDetail student={student} /> : null}
        {mode === 'progress' ? <ProgressDetail student={student} /> : null}
        {mode === 'ficha' ? <FichaDetail student={student} /> : null}
        {mode === 'profile' ? <UserProfileDetail student={student} /> : null}
      </>
    );
  }

  return (
    <>
      <View style={styles.actionSheetHeader}>
        <View>
          <Text style={styles.modalTitle}>{student.name}</Text>
          <Text style={styles.meta}>{student.email}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.smallLinkButton}>
          <Text style={styles.smallLinkButtonText}>Cerrar</Text>
        </Pressable>
      </View>

      <View style={styles.studentActionGrid}>
        <StudentActionButton icon={HeartPulse} label="Detalle pastoral" onPress={() => onModeChange('pastoral')} />
        <StudentActionButton icon={BarChart3} label="Progreso" onPress={() => onModeChange('progress')} />
        <StudentActionButton icon={ClipboardEdit} label="Ficha" onPress={() => onModeChange('ficha')} />
        <StudentActionButton icon={CircleUserRound} label="Perfil del usuario" onPress={() => onModeChange('profile')} />
        <StudentActionButton
          disabled={busy}
          icon={blocked ? Unlock : Lock}
          label={blocked ? 'Activar' : 'Bloquear'}
          onPress={onToggleStatus}
        />
        <StudentActionButton danger disabled={busy} icon={Trash2} label="Eliminar" onPress={onDelete} />
      </View>
    </>
  );
}

function StudentActionButton({
  danger = false,
  disabled = false,
  icon: Icon,
  label,
  onPress,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: typeof UserCog;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.studentActionButton, danger && styles.studentActionButtonDanger, disabled && styles.disabled]}
    >
      <Icon color={danger ? '#b42318' : '#1b6fd7'} size={22} strokeWidth={2.2} />
      <Text style={[styles.studentActionButtonText, danger && styles.studentActionButtonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

function PastoralDetail({ student }: { student: TutorStudent }) {
  const profile = student.pastoral_profile;

  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="pastoral" size="medium" text="Detalle pastoral" />
      <InfoRow label="Estado emocional" value={profile?.emotional_state} />
      <InfoRow label="Alertas de cuidado" value={profile?.care_alerts} />
      <InfoRow label="Proximos pasos" value={profile?.next_steps} />
      <InfoRow label="Notas del tutor" value={profile?.tutor_notes} />
      <InfoRow label="Ultima actualizacion" value={formatDateTime(profile?.pastoral_updated_at)} />
    </View>
  );
}

function ProgressDetail({ student }: { student: TutorStudent }) {
  const progress = student.progress;

  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="content" size="medium" text="Progreso" />
      <View style={styles.progressSummary}>
        <Text style={styles.progressPercent}>{progress?.overall_percentage ?? 0}%</Text>
        <Text style={styles.meta}>
          {progress?.completed_lessons ?? 0} de {progress?.total_lessons ?? 0} lecciones completadas
        </Text>
      </View>
      {progress?.courses?.length ? (
        progress.courses.map((course) => (
          <View key={course.id} style={styles.progressCourse}>
            <View style={styles.progressCourseHeader}>
              <Text style={styles.cardTitle}>{course.name}</Text>
              <Text style={styles.progressCoursePercent}>{course.percentage}%</Text>
            </View>
            <Text style={styles.meta}>{course.source}{course.owner_name ? ` - ${course.owner_name}` : ''}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(course.percentage, 100))}%` }]} />
            </View>
            <Text style={styles.meta}>
              {course.completed_lessons} / {course.total_lessons} lecciones
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.muted}>Este usuario todavia no tiene contenidos visibles.</Text>
      )}
    </View>
  );
}

function FichaDetail({ student }: { student: TutorStudent }) {
  const profile = student.pastoral_profile;

  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="pastoral" size="medium" text="Ficha" />
      <InfoRow label="Situacion sentimental" value={profile?.sentimental_status} />
      <InfoRow
        label="Hijos"
        value={profile?.has_children ? `Si${profile.children_count ? `, ${profile.children_count}` : ''}` : 'No'}
      />
      <InfoRow label="Situacion familiar" value={profile?.family_situation} />
      <InfoRow label="Desafios actuales" value={profile?.current_challenges} />
      <InfoRow label="Necesidades espirituales" value={profile?.spiritual_needs} />
      <InfoRow label="Pedidos de oracion" value={profile?.prayer_requests} />
      <InfoRow label="Red de apoyo" value={profile?.support_network} />
      <InfoRow label="Preferencias de comunicacion" value={profile?.communication_preferences} />
    </View>
  );
}

function UserProfileDetail({ student }: { student: TutorStudent }) {
  const profile = student.profile;

  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="profile" size="medium" text="Perfil del usuario" />
      <InfoRow label="Nombre completo" value={profile?.full_name ?? student.name} />
      <InfoRow label="Email" value={profile?.email ?? student.email} />
      <InfoRow label="Fecha de nacimiento" value={profile?.birth_date} />
      <InfoRow label="Telefono" value={profile?.phone} />
      <InfoRow label="Direccion" value={profile?.address} />
      <InfoRow label="Pais" value={profile?.country} />
      <InfoRow label="Provincia / Estado" value={profile?.state} />
      <InfoRow label="Ciudad / Localidad" value={profile?.city} />
      <InfoRow label="Codigo postal" value={profile?.postal_code} />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'Sin completar'}</Text>
    </View>
  );
}

function GroupCard({
  deleting,
  group,
  onAssign,
  onDelete,
  onEdit,
}: {
  deleting: boolean;
  group: TutorGroup;
  onAssign: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.groupIcon}>
          <UsersRound color="#1b6fd7" size={22} strokeWidth={2.2} />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{group.name}</Text>
          <Text style={styles.meta}>{group.students_count ?? group.students?.length ?? 0} usuarios</Text>
        </View>
        <StatusBadge value={group.status ?? 'activo'} />
      </View>
      {group.description ? <Text style={styles.text}>{group.description}</Text> : null}
      <View style={styles.metaWrap}>
        <Text style={styles.meta}>Inicio: {group.start_date ?? 'Sin fecha'}</Text>
        <Text style={styles.meta}>Horario: {group.meeting_time ?? 'Sin horario'}</Text>
        <Text style={styles.meta}>Modalidad: {group.modality ?? 'Sin datos'}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.secondaryAction} onPress={onAssign}>
          <Text style={styles.secondaryActionText}>Usuarios</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={onEdit}>
          <Text style={styles.secondaryActionText}>Editar</Text>
        </Pressable>
        <Pressable disabled={deleting} style={styles.dangerAction} onPress={onDelete}>
          <Trash2 color="#b42318" size={16} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  ...props
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput placeholderTextColor="#94a3b8" style={[styles.input, props.multiline && styles.inputMultiline]} {...props} />
    </View>
  );
}

function Choice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function ModalActions({
  busy,
  onCancel,
  onSave,
  saveLabel,
}: {
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <View style={styles.modalActions}>
      <Pressable disabled={busy} style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancelar</Text>
      </Pressable>
      <Pressable disabled={busy} style={[styles.primaryButton, busy && styles.disabled]} onPress={onSave}>
        <Text style={styles.primaryButtonText}>{busy ? 'Guardando...' : saveLabel}</Text>
      </Pressable>
    </View>
  );
}

function StatusBadge({ value }: { value: string }) {
  const inactive = value !== 'activo';

  return (
    <View style={[styles.badge, inactive && styles.badgeMuted]}>
      <Text style={[styles.badgeText, inactive && styles.badgeTextMuted]}>{value}</Text>
    </View>
  );
}

function EmptyCard({ text, title }: { text: string; title: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function CenteredState({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function confirmDeleteStudent(student: TutorStudent, onConfirm: (id: number) => void) {
  Alert.alert('Eliminar usuario', `Eliminar a ${student.name}?`, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(student.id), style: 'destructive', text: 'Eliminar' },
  ]);
}

function confirmToggleStudentStatus(
  student: TutorStudent,
  onConfirm: (id: number, status: 'activo' | 'bloqueado') => void,
) {
  const blocked = student.status === 'bloqueado';
  const nextStatus = blocked ? 'activo' : 'bloqueado';
  const title = blocked ? 'Activar usuario' : 'Bloquear usuario';
  const message = blocked
    ? `Activar el acceso de ${student.name}?`
    : `Bloquear el acceso de ${student.name}?`;

  Alert.alert(title, message, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(student.id, nextStatus), style: blocked ? 'default' : 'destructive', text: blocked ? 'Activar' : 'Bloquear' },
  ]);
}

function confirmDeleteGroup(group: TutorGroup, onConfirm: (id: number) => void) {
  Alert.alert('Eliminar grupo', `Eliminar el grupo ${group.name}?`, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(group.id), style: 'destructive', text: 'Eliminar' },
  ]);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  actionSheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignmentRow: {
    alignItems: 'center',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    padding: 10,
  },
  assignmentRowSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#8bbcf0',
  },
  assignmentText: {
    flex: 1,
    gap: 2,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  badge: {
    backgroundColor: '#e7f8ee',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeMuted: {
    backgroundColor: '#f1f5f9',
  },
  badgeText: {
    color: '#087443',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeTextMuted: {
    color: '#64748b',
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardHint: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '800',
  },
  cardTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  checkBox: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkBoxSelected: {
    backgroundColor: '#1b6fd7',
    borderColor: '#1b6fd7',
  },
  choice: {
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#8bbcf0',
  },
  choiceText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  choiceTextSelected: {
    color: '#1b6fd7',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  dangerAction: {
    alignItems: 'center',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dangerActionText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.65,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 6,
  },
  detailBlock: {
    gap: 12,
  },
  groupIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  header: {
    gap: 6,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  inputMultiline: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  infoLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  infoRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 11,
  },
  infoValue: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  metaWrap: {
    gap: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 6,
  },
  centeredModalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  centeredModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 12,
    padding: 18,
    width: '100%',
  },
  centeredModalScroll: {
    maxHeight: '90%',
    width: '100%',
  },
  modalTitle: {
    color: '#151922',
    fontSize: 20,
    fontWeight: '900',
  },
  modalHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  progressCourse: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  progressCourseHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  progressCoursePercent: {
    color: '#1b6fd7',
    fontSize: 16,
    fontWeight: '900',
  },
  progressFill: {
    backgroundColor: '#1b6fd7',
    borderRadius: 999,
    height: '100%',
  },
  progressPercent: {
    color: '#1b6fd7',
    fontSize: 34,
    fontWeight: '900',
  },
  progressSummary: {
    backgroundColor: '#e8f1ff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  progressTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  scroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 24,
  },
  secondaryAction: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 18,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
  },
  smallLinkButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  smallLinkButtonText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  studentActionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 92,
    padding: 10,
  },
  studentActionButtonDanger: {
    backgroundColor: '#fff7f7',
    borderColor: '#fecaca',
  },
  studentActionButtonText: {
    color: '#151922',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  studentActionButtonTextDanger: {
    color: '#b42318',
  },
  studentActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 14,
    maxHeight: '88%',
    padding: 18,
    width: '100%',
  },
  studentActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
  },
  tabActive: {
    backgroundColor: '#e8f1ff',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#1b6fd7',
  },
  tabs: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  text: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
});

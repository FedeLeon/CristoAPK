import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  Check,
  CircleUserRound,
  ClipboardEdit,
  Lock,
  Pencil,
  RefreshCcw,
  Search,
  Trash2,
  Unlock,
  UserCog,
  UsersRound,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  deleteAdminIndividual,
  getAdminIndividuals,
  toggleAdminIndividualStatus,
  updateAdminIndividual,
  type AdminIndividualsTab,
  type UpdateAdminIndividualInput,
} from '../src/api/adminIndividuals';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { AdminIndividual, AdminIndividualRole, AdminIndividualStatus } from '../src/types/api';

type DetailMode = 'actions' | 'profile' | 'ficha';

type FormState = {
  email: string;
  last_name: string;
  name: string;
  password: string;
  password_confirmation: string;
  role: AdminIndividualRole;
  status: AdminIndividualStatus;
  tutor_id: number | null;
};

const tabs: Array<{ icon: typeof UsersRound; key: AdminIndividualsTab; label: string }> = [
  { icon: UsersRound, key: 'all', label: 'Todos' },
  { icon: CircleUserRound, key: 'pastors', label: 'Pastores' },
  { icon: UserCog, key: 'tutors', label: 'Tutores' },
  { icon: UsersRound, key: 'students', label: 'Usuarios' },
];

const roleOptions: Array<{ label: string; value: AdminIndividualRole }> = [
  { label: 'Usuario', value: 'student' },
  { label: 'Tutor', value: 'tutor' },
  { label: 'Pastor', value: 'pastor' },
];

const statusOptions: Array<{ label: string; value: AdminIndividualStatus }> = [
  { label: 'Activo', value: 'activo' },
  { label: 'Bloqueado', value: 'bloqueado' },
];

function formFromUser(user: AdminIndividual): FormState {
  return {
    email: user.email,
    last_name: user.last_name ?? '',
    name: user.name,
    password: '',
    password_confirmation: '',
    role: user.role,
    status: user.status,
    tutor_id: user.tutor?.id ?? null,
  };
}

function payloadFromForm(id: number, form: FormState): UpdateAdminIndividualInput {
  return {
    email: form.email.trim(),
    id,
    last_name: form.last_name.trim() || null,
    name: form.name.trim(),
    password: form.password || undefined,
    password_confirmation: form.password ? form.password_confirmation : undefined,
    role: form.role,
    status: form.status,
    tutor_id: form.role === 'student' ? form.tutor_id : null,
  };
}

export default function AdminIndividualsScreen() {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab = isAdminIndividualsTab(params.tab) ? params.tab : 'all';
  const [activeTab, setActiveTab] = useState<AdminIndividualsTab>(initialTab);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | AdminIndividualStatus>('');
  const [selectedUser, setSelectedUser] = useState<AdminIndividual | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('actions');
  const [editingUser, setEditingUser] = useState<AdminIndividual | null>(null);
  const [form, setForm] = useState<FormState | null>(null);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  const individualsQuery = useQuery({
    queryKey: ['admin-individuals', activeTab, search, status],
    queryFn: () => getAdminIndividuals({ search, status, tab: activeTab }),
    enabled: meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin',
  });

  const refreshIndividuals = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-individuals'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: FormState }) => updateAdminIndividual(payloadFromForm(id, input)),
    onSuccess: async () => {
      setEditingUser(null);
      setForm(null);
      await refreshIndividuals();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: toggleAdminIndividualStatus,
    onSuccess: refreshIndividuals,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminIndividual,
    onSuccess: refreshIndividuals,
  });

  useEffect(() => {
    if (isAdminIndividualsTab(params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const tutors = individualsQuery.data?.tutors ?? [];
  const users = individualsQuery.data?.data ?? [];
  const totalByRole = useMemo(
    () => ({
      pastors: users.filter((user) => user.role === 'pastor').length,
      students: users.filter((user) => user.role === 'student').length,
      tutors: users.filter((user) => user.role === 'tutor').length,
    }),
    [users],
  );

  if (meQuery.isLoading) {
    return <CenteredState text="Cargando sesion..." />;
  }

  if (meQuery.data?.role !== 'admin' && meQuery.data?.role !== 'superadmin') {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="users" text="Individuos" />
        <Text style={styles.error}>Esta seccion esta disponible solo para administradores.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={individualsQuery.isRefetching} onRefresh={individualsQuery.refetch} />}
      >
        <View style={styles.header}>
          <ScreenTitle icon="users" text="Individuos" />
          <Text style={styles.muted}>Gestion administrativa de pastores, tutores y usuarios.</Text>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, selected && styles.tabActive]}
              >
                <Icon color={selected ? '#1b6fd7' : '#64748b'} size={18} strokeWidth={2.2} />
                <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={[styles.tabText, selected && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.filters}>
          <View style={styles.searchBox}>
            <Search color="#64748b" size={18} strokeWidth={2.2} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setSearch}
              placeholder="Buscar por nombre o email"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              value={search}
            />
          </View>
          <View style={styles.choiceWrap}>
            <Choice label="Todos" selected={status === ''} onPress={() => setStatus('')} />
            <Choice label="Activos" selected={status === 'activo'} onPress={() => setStatus('activo')} />
            <Choice label="Bloqueados" selected={status === 'bloqueado'} onPress={() => setStatus('bloqueado')} />
          </View>
        </View>

        {activeTab === 'all' ? (
          <View style={styles.metrics}>
            <Metric icon={CircleUserRound} label="Pastores" value={totalByRole.pastors} />
            <Metric icon={UserCog} label="Tutores" value={totalByRole.tutors} />
            <Metric icon={UsersRound} label="Usuarios" value={totalByRole.students} />
          </View>
        ) : null}

        {individualsQuery.isLoading ? <CenteredInline text="Cargando individuos..." /> : null}

        {individualsQuery.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.error}>{getApiErrorMessage(individualsQuery.error)}</Text>
            <Pressable style={styles.secondaryButton} onPress={() => individualsQuery.refetch()}>
              <RefreshCcw color="#151922" size={18} strokeWidth={2.2} />
              <Text style={styles.secondaryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!individualsQuery.isLoading && !individualsQuery.isError ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{tabTitle(activeTab)}</Text>
            {users.length ? (
              users.map((user) => (
                <IndividualCard
                  key={user.id}
                  onOpen={() => {
                    setSelectedUser(user);
                    setDetailMode('actions');
                  }}
                  user={user}
                />
              ))
            ) : (
              <EmptyCard title="Sin resultados" text="No hay individuos para los filtros actuales." />
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal animationType="fade" transparent visible={Boolean(selectedUser)} onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.centeredModalBackdrop}>
          <View style={styles.actionSheetCard}>
            {selectedUser ? (
              <IndividualActionModal
                busy={toggleStatusMutation.isPending || deleteMutation.isPending}
                mode={detailMode}
                onBack={() => setDetailMode('actions')}
                onClose={() => setSelectedUser(null)}
                onDelete={() =>
                  confirmDeleteUser(selectedUser, (id) => {
                    setSelectedUser(null);
                    deleteMutation.mutate(id);
                  })
                }
                onEdit={() => {
                  setEditingUser(selectedUser);
                  setForm(formFromUser(selectedUser));
                  setSelectedUser(null);
                }}
                onModeChange={setDetailMode}
                onToggleStatus={() =>
                  confirmToggleStatus(selectedUser, (id) => {
                    setSelectedUser(null);
                    toggleStatusMutation.mutate(id);
                  })
                }
                user={selectedUser}
              />
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={Boolean(editingUser && form)} onRequestClose={() => setEditingUser(null)}>
        <View style={styles.centeredModalBackdrop}>
          <ScrollView contentContainerStyle={styles.centeredModalCard} style={styles.centeredModalScroll}>
            {editingUser && form ? (
              <>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={styles.modalTitle}>Editar individuo</Text>
                    <Text style={styles.meta}>{editingUser.email}</Text>
                  </View>
                  <Pressable accessibilityRole="button" onPress={() => setEditingUser(null)} style={styles.smallLinkButton}>
                    <Text style={styles.smallLinkButtonText}>Cerrar</Text>
                  </Pressable>
                </View>

                <Field label="Nombre" value={form.name} onChangeText={(name) => setForm({ ...form, name })} />
                <Field label="Apellido" value={form.last_name} onChangeText={(last_name) => setForm({ ...form, last_name })} />
                <Field
                  autoCapitalize="none"
                  keyboardType="email-address"
                  label="Email"
                  value={form.email}
                  onChangeText={(email) => setForm({ ...form, email })}
                />

                <Text style={styles.inputLabel}>Rol</Text>
                <View style={styles.choiceWrap}>
                  {roleOptions.map((role) => (
                    <Choice
                      key={role.value}
                      label={role.label}
                      selected={form.role === role.value}
                      onPress={() => setForm({ ...form, role: role.value, tutor_id: role.value === 'student' ? form.tutor_id : null })}
                    />
                  ))}
                </View>

                <Text style={styles.inputLabel}>Estado</Text>
                <View style={styles.choiceWrap}>
                  {statusOptions.map((option) => (
                    <Choice
                      key={option.value}
                      label={option.label}
                      selected={form.status === option.value}
                      onPress={() => setForm({ ...form, status: option.value })}
                    />
                  ))}
                </View>

                {form.role === 'student' ? (
                  <>
                    <Text style={styles.inputLabel}>Tutor asignado</Text>
                    <View style={styles.choiceWrap}>
                      <Choice label="Sin tutor" selected={!form.tutor_id} onPress={() => setForm({ ...form, tutor_id: null })} />
                      {tutors.map((tutor) => (
                        <Choice
                          key={tutor.id}
                          label={tutor.name}
                          selected={form.tutor_id === tutor.id}
                          onPress={() => setForm({ ...form, tutor_id: tutor.id })}
                        />
                      ))}
                    </View>
                  </>
                ) : null}

                <Field
                  label="Nueva contrasena"
                  secureTextEntry
                  value={form.password}
                  onChangeText={(password) => setForm({ ...form, password })}
                />
                <Field
                  label="Confirmar contrasena"
                  secureTextEntry
                  value={form.password_confirmation}
                  onChangeText={(password_confirmation) => setForm({ ...form, password_confirmation })}
                />

                {saveMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(saveMutation.error)}</Text> : null}
                <ModalActions
                  busy={saveMutation.isPending}
                  onCancel={() => {
                    setEditingUser(null);
                    setForm(null);
                  }}
                  onSave={() => saveMutation.mutate({ id: editingUser.id, input: form })}
                  saveLabel="Guardar"
                />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function IndividualCard({
  onOpen,
  user,
}: {
  onOpen: () => void;
  user: AdminIndividual;
}) {
  const blocked = user.status === 'bloqueado';

  return (
    <Pressable accessibilityRole="button" onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardHeader}>
        <UserAvatar size={48} user={user} />
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{user.full_name}</Text>
          <Text style={styles.meta}>{user.email}</Text>
        </View>
        <StatusBadge value={user.status_label} inactive={blocked} />
      </View>
      <View style={styles.metaWrap}>
        <Text style={styles.meta}>Rol: {user.role_label}</Text>
        <Text style={styles.meta}>Origen: {user.registration_source_label ?? 'Sin historial previo'}</Text>
        {user.created_by ? <Text style={styles.meta}>Creado por: {user.created_by}</Text> : null}
        {user.role === 'student' ? <Text style={styles.meta}>Tutor: {user.tutor?.name ?? 'Sin tutor'}</Text> : null}
        {user.role === 'tutor' ? <Text style={styles.meta}>Usuarios asignados: {user.students_count ?? 0}</Text> : null}
      </View>
      <Text style={styles.cardHint}>Toca para ver acciones</Text>
    </Pressable>
  );
}

function IndividualActionModal({
  busy,
  mode,
  onBack,
  onClose,
  onDelete,
  onEdit,
  onModeChange,
  onToggleStatus,
  user,
}: {
  busy: boolean;
  mode: DetailMode;
  onBack: () => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onModeChange: (mode: DetailMode) => void;
  onToggleStatus: () => void;
  user: AdminIndividual;
}) {
  const blocked = user.status === 'bloqueado';

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
        <ScrollView contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator style={styles.detailScroll}>
          {mode === 'profile' ? <ProfileDetail user={user} /> : null}
          {mode === 'ficha' ? <FichaDetail user={user} /> : null}
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <View style={styles.actionSheetHeader}>
        <View style={styles.actionSheetIdentity}>
          <UserAvatar size={46} user={user} />
          <View style={styles.cardHeaderText}>
            <Text style={styles.modalTitle}>{user.full_name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.smallLinkButton}>
          <Text style={styles.smallLinkButtonText}>Cerrar</Text>
        </Pressable>
      </View>

      <View style={styles.actionGrid}>
        <IndividualActionButton icon={CircleUserRound} label="Perfil" onPress={() => onModeChange('profile')} />
        <IndividualActionButton icon={ClipboardEdit} label="Ficha" onPress={() => onModeChange('ficha')} />
        <IndividualActionButton icon={Pencil} label="Editar" onPress={onEdit} />
        <IndividualActionButton
          disabled={busy}
          icon={blocked ? Unlock : Lock}
          label={blocked ? 'Activar' : 'Bloquear'}
          onPress={onToggleStatus}
        />
        <IndividualActionButton danger disabled={busy} icon={Trash2} label="Eliminar" onPress={onDelete} />
      </View>
    </>
  );
}

function IndividualActionButton({
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
      style={[styles.actionButton, danger && styles.actionButtonDanger, disabled && styles.disabled]}
    >
      <Icon color={danger ? '#b42318' : '#1b6fd7'} size={22} strokeWidth={2.2} />
      <Text style={[styles.actionButtonText, danger && styles.actionButtonTextDanger]}>{label}</Text>
    </Pressable>
  );
}

function ProfileDetail({ user }: { user: AdminIndividual }) {
  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="profile" size="medium" text="Perfil" />
      <InfoRow label="Nombre completo" value={user.full_name} />
      <InfoRow label="Email" value={user.email} />
      <InfoRow label="Rol" value={user.role_label} />
      <InfoRow label="Estado" value={user.status_label} />
      <InfoRow label="Tutor asignado" value={user.role === 'student' ? user.tutor?.name : null} />
      <InfoRow label="Usuarios asignados" value={user.role === 'tutor' ? String(user.students_count ?? 0) : null} />
    </View>
  );
}

function FichaDetail({ user }: { user: AdminIndividual }) {
  return (
    <View style={styles.detailBlock}>
      <ScreenTitle icon="users" size="medium" text="Ficha" />
      <InfoRow label="Origen" value={user.registration_source_label} />
      <InfoRow label="Creado por" value={user.created_by} />
      <InfoRow label="Alcance administrativo" value={user.role_label} />
      <InfoRow label="Estado de acceso" value={user.status_label} />
      <Text style={styles.muted}>
        Para modificar datos, rol, tutor asignado, estado o contrasena, usa la accion Editar.
      </Text>
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

function UserAvatar({ size, user }: { size: number; user: AdminIndividual }) {
  if (user.avatar_url) {
    return <Image source={{ uri: user.avatar_url }} style={[styles.userAvatar, { height: size, width: size }]} />;
  }

  return (
    <View
      style={[
        styles.userAvatar,
        styles.userAvatarFallback,
        { backgroundColor: user.avatar_color ?? '#1b6fd7', height: size, width: size },
      ]}
    >
      <Text style={styles.userAvatarInitials}>{user.avatar_initials ?? user.name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Icon color="#1b6fd7" size={22} strokeWidth={2.2} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Field({
  label,
  ...props
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'number-pad';
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
        {busy ? <ActivityIndicator color="#ffffff" /> : <Check color="#ffffff" size={18} strokeWidth={2.4} />}
        <Text style={styles.primaryButtonText}>{busy ? 'Guardando...' : saveLabel}</Text>
      </Pressable>
    </View>
  );
}

function StatusBadge({ inactive, value }: { inactive: boolean; value: string }) {
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

function CenteredInline({ text }: { text: string }) {
  return (
    <View style={styles.inlineCenter}>
      <ActivityIndicator />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

function confirmDeleteUser(user: AdminIndividual, onConfirm: (id: number) => void) {
  Alert.alert('Eliminar individuo', `Eliminar a ${user.full_name}?`, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(user.id), style: 'destructive', text: 'Eliminar' },
  ]);
}

function confirmToggleStatus(user: AdminIndividual, onConfirm: (id: number) => void) {
  const blocked = user.status === 'bloqueado';

  Alert.alert(blocked ? 'Activar individuo' : 'Bloquear individuo', `${blocked ? 'Activar' : 'Bloquear'} a ${user.full_name}?`, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(user.id), style: blocked ? 'default' : 'destructive', text: blocked ? 'Activar' : 'Bloquear' },
  ]);
}

function isAdminIndividualsTab(value?: string): value is AdminIndividualsTab {
  return value === 'all' || value === 'pastors' || value === 'tutors' || value === 'students';
}

function tabTitle(tab: AdminIndividualsTab) {
  return tabs.find((item) => item.key === tab)?.label ?? 'Individuos';
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e9f7ef',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeMuted: {
    backgroundColor: '#f2f4f7',
  },
  badgeText: {
    color: '#087443',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeTextMuted: {
    color: '#667085',
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#f2f4f7',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  cancelButtonText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cardPressed: {
    borderColor: '#9ec5fe',
    transform: [{ translateY: -1 }],
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  cardHint: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  centeredModalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  centeredModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 12,
    padding: 18,
    paddingBottom: 28,
  },
  centeredModalScroll: {
    maxHeight: '92%',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#1b6fd7',
  },
  choiceText: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '800',
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
    gap: 12,
    padding: 20,
  },
  dangerAction: {
    alignItems: 'center',
    backgroundColor: '#fff7f7',
    borderColor: '#ffd6d6',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 18,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#fff7f7',
    borderColor: '#ffd6d6',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  field: {
    gap: 6,
  },
  filters: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  header: {
    gap: 8,
  },
  inlineCenter: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  inputLabel: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  meta: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  metaWrap: {
    gap: 4,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 92,
    padding: 10,
  },
  metricLabel: {
    color: '#475467',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  metricValue: {
    color: '#151922',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
  },
  actionSheetCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    gap: 14,
    maxHeight: '88%',
    padding: 18,
    paddingBottom: 28,
  },
  actionSheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionSheetIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: '#c7daf7',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 86,
    padding: 10,
  },
  actionButtonDanger: {
    backgroundColor: '#fff7f7',
    borderColor: '#ffd6d6',
  },
  actionButtonText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionButtonTextDanger: {
    color: '#b42318',
  },
  detailScroll: {
    maxHeight: 520,
  },
  detailScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  detailBlock: {
    gap: 10,
  },
  infoRow: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  muted: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  scroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 96,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#151922',
    flex: 1,
    fontSize: 15,
    minWidth: 0,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: '#c7daf7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '900',
  },
  smallLinkButton: {
    alignItems: 'center',
    backgroundColor: '#f2f4f7',
    borderRadius: 8,
    minHeight: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  smallLinkButtonText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  tab: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexBasis: 0,
    gap: 5,
    justifyContent: 'center',
    minHeight: 60,
    minWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  tabActive: {
    backgroundColor: '#edf5ff',
    borderColor: '#1b6fd7',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
  },
  tabTextActive: {
    color: '#1b6fd7',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  userAvatar: {
    borderRadius: 999,
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});

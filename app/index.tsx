import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  BookOpen,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  IdCard,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  Quote,
  Trash2,
  Unlock,
  UsersRound,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getDashboard,
  markDashboardAnnouncementRead,
  updateAdminAnnouncement,
  updateAdminAnnouncementStatus,
  type AdminAnnouncementInput,
} from '../src/api/dashboard';
import { getAuthToken } from '../src/auth/tokenStorage';
import { ScreenTitle } from '../src/components/ScreenTitle';
import {
  ApiUser,
  DashboardAdminAnnouncement,
  DashboardAdminMetric,
  DashboardAnnouncement,
  DashboardTutorMetric,
} from '../src/types/api';

function getRoleDashboard(user?: ApiUser) {
  if (!user) {
    return {
      label: 'Visitante',
      title: 'Bienvenido a MDS',
      message: 'Mensaje de salvacion',
    };
  }

  if (user.role === 'admin' || user.role === 'superadmin') {
    return {
      label: 'Administrador',
      title: 'Dashboard Admin',
      message: 'Bienvenido al panel mobile de administracion.',
    };
  }

  if (user.role === 'tutor') {
    return {
      label: 'Tutor',
      title: 'Dashboard Tutor',
      message: 'Bienvenido al panel mobile de acompanamiento.',
    };
  }

  return {
    label: 'Usuario',
    title: 'Dashboard Usuario',
    message: 'Bienvenido a tu espacio mobile de aprendizaje.',
  };
}

function shouldShowProfilePrompt(user?: ApiUser) {
  if (!user?.profile_completion_required) {
    return false;
  }

  return user.profile_complete === false;
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const tokenQuery = useQuery({
    queryKey: ['auth-token'],
    queryFn: getAuthToken,
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: Boolean(tokenQuery.data),
  });

  const isLoggedIn = Boolean(tokenQuery.data && meQuery.data);
  const isAdmin = meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin';
  const isStudent = meQuery.data?.role === 'student';
  const isTutor = meQuery.data?.role === 'tutor';
  const dashboard = getRoleDashboard(meQuery.data);
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: Boolean(isLoggedIn && (isStudent || isTutor || isAdmin)),
  });
  const markAnnouncementReadMutation = useMutation({
    mutationFn: markDashboardAnnouncementRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const quickActions = [
    { icon: GraduationCap, label: 'Contenido general', route: '/cursos' },
    { icon: BookOpen, label: 'Biblia', route: '/biblia' },
    { icon: CalendarDays, label: 'Reuniones', route: '/reuniones' },
    { icon: MessageCircle, label: 'Chat', route: '/chat' },
  ] as const;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={StyleSheet.flatten([styles.container, !isLoggedIn && styles.containerCentered])}
    >
      {isLoggedIn && shouldShowProfilePrompt(meQuery.data) ? (
        <View style={styles.profilePrompt}>
          <View style={styles.blockHeader}>
            <View style={styles.profilePromptIcon}>
              <IdCard color="#9a3412" size={21} strokeWidth={2.2} />
            </View>
            <View style={styles.blockHeaderText}>
              <Text style={styles.profilePromptEyebrow}>Perfil pendiente</Text>
              <Text style={styles.blockTitle}>Completa tu perfil</Text>
            </View>
          </View>
          <Text style={styles.blockMeta}>
            Completa tus datos personales y sube una imagen de perfil para dejar de ver este aviso.
          </Text>
          {meQuery.data?.missing_profile_fields?.length ? (
            <Text numberOfLines={2} style={styles.profilePromptMissing}>
              Falta: {meQuery.data.missing_profile_fields.map((field) => field.label).join(', ')}
            </Text>
          ) : null}
          <Pressable style={styles.profilePromptButton} onPress={() => router.push('/perfil')}>
            <Text style={styles.profilePromptButtonText}>Ir al perfil</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.brandPanel}>
        <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
        <Text style={styles.heroTitle}>{isLoggedIn ? dashboard.title : 'Bienvenido a MDS'}</Text>
        <Text style={styles.subtitle}>{isLoggedIn ? dashboard.message : 'Mensaje de salvacion'}</Text>
        {tokenQuery.isLoading || meQuery.isLoading ? (
          <View style={styles.sessionRow}>
            <ActivityIndicator />
            <Text style={styles.sessionText}>Cargando sesion...</Text>
          </View>
        ) : null}
        {meQuery.isError ? <Text style={styles.error}>{getApiErrorMessage(meQuery.error)}</Text> : null}
      </View>

      {isLoggedIn ? (
        <>
          {isAdmin ? (
            <AdminDashboardBlocks
              data={dashboardQuery.data}
              error={dashboardQuery.error}
              isError={dashboardQuery.isError}
              isLoading={dashboardQuery.isLoading}
            />
          ) : null}

          {isStudent || isTutor ? (
            <DashboardBlocks
              data={dashboardQuery.data}
              error={dashboardQuery.error}
              isError={dashboardQuery.isError}
              isLoading={dashboardQuery.isLoading}
              markReadId={markAnnouncementReadMutation.variables}
              onMarkRead={(id) => markAnnouncementReadMutation.mutate(id)}
              role={isTutor ? 'tutor' : 'student'}
            />
          ) : null}

          <View style={styles.quickGrid}>
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Pressable key={action.route} style={styles.quickButton} onPress={() => router.push(action.route)}>
                  <Icon color="#1b6fd7" size={28} strokeWidth={2.1} />
                  <Text style={styles.quickButtonText}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Ingresar</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const emptyAnnouncementForm: AdminAnnouncementInput = {
  body: '',
  ends_at: '',
  image: undefined,
  starts_at: '',
  status: 'activo',
  title: '',
};

function filenameFromUri(uri: string) {
  return uri.split('/').pop() || `announcement-${Date.now()}.jpg`;
}

function mimeFromUri(uri: string) {
  const extension = filenameFromUri(uri).split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

function AdminDashboardBlocks({
  data,
  error,
  isError,
  isLoading,
}: {
  data?: Awaited<ReturnType<typeof getDashboard>>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<DashboardAdminAnnouncement | null>(null);
  const [form, setForm] = useState<AdminAnnouncementInput>(emptyAnnouncementForm);

  const refreshDashboard = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AdminAnnouncementInput }) =>
      id ? updateAdminAnnouncement(id, input) : createAdminAnnouncement(input),
    onSuccess: async () => {
      setModalOpen(false);
      setEditingAnnouncement(null);
      setForm(emptyAnnouncementForm);
      await refreshDashboard();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'activo' | 'inactivo' }) => updateAdminAnnouncementStatus(id, status),
    onSuccess: refreshDashboard,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminAnnouncement,
    onSuccess: refreshDashboard,
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para elegir una imagen del dispositivo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 9],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const uri = result.assets[0].uri;
    setForm((current) => ({
      ...current,
      image: {
        name: filenameFromUri(uri),
        type: mimeFromUri(uri),
        uri,
      },
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.dashboardBlock}>
        <ActivityIndicator />
        <Text style={styles.sessionText}>Cargando panel admin...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.dashboardBlock}>
        <ScreenTitle icon="home" size="medium" text="No se pudo cargar el dashboard" />
        <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
      </View>
    );
  }

  const announcements = data?.admin_announcements ?? [];

  return (
    <>
      {data?.admin_metrics?.length ? <AdminMetricsBlock metrics={data.admin_metrics} /> : null}

      <View style={styles.dashboardBlock}>
        <View style={styles.blockHeader}>
          <View style={styles.blockIcon}>
            <Megaphone color="#1b6fd7" size={21} strokeWidth={2.2} />
          </View>
          <View style={styles.blockHeaderText}>
            <Text style={styles.blockEyebrow}>Anuncios generales</Text>
            <Text style={styles.blockTitle}>Crear y gestionar avisos de toda la app</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={styles.iconActionButton}
            onPress={() => {
              setEditingAnnouncement(null);
              setForm(emptyAnnouncementForm);
              setModalOpen(true);
            }}
          >
            <Plus color="#ffffff" size={19} strokeWidth={2.5} />
          </Pressable>
        </View>

        {announcements.length ? (
          <View style={styles.announcementList}>
            {announcements.map((announcement) => (
              <AdminAnnouncementCard
                announcement={announcement}
                busy={statusMutation.isPending || deleteMutation.isPending}
                key={announcement.id}
                onDelete={() => confirmDeleteAdminAnnouncement(announcement, deleteMutation.mutate)}
                onEdit={() => {
                  setEditingAnnouncement(announcement);
                  setForm({
                    body: announcement.body,
                    ends_at: announcement.ends_at ?? '',
                    image: undefined,
                    starts_at: announcement.starts_at ?? '',
                    status: announcement.status === 'inactivo' ? 'inactivo' : 'activo',
                    title: announcement.title,
                  });
                  setModalOpen(true);
                }}
                onToggleStatus={() =>
                  statusMutation.mutate({
                    id: announcement.id,
                    status: announcement.status === 'activo' ? 'inactivo' : 'activo',
                  })
                }
              />
            ))}
          </View>
        ) : (
          <Text style={styles.blockMeta}>No hay anuncios generales creados por este admin.</Text>
        )}
      </View>

      <Modal animationType="slide" transparent visible={modalOpen} onRequestClose={() => setModalOpen(false)}>
        <View style={styles.centeredModalBackdrop}>
          <ScrollView contentContainerStyle={styles.centeredModalCard} style={styles.centeredModalScroll}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>{editingAnnouncement ? 'Editar anuncio' : 'Nuevo anuncio'}</Text>
                <Text style={styles.blockMeta}>Aviso general visible para toda la app.</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setModalOpen(false)} style={styles.smallLinkButton}>
                <Text style={styles.smallLinkButtonText}>Cerrar</Text>
              </Pressable>
            </View>

            <DashboardField label="Titulo" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
            <DashboardField
              label="Mensaje"
              multiline
              value={form.body}
              onChangeText={(body) => setForm({ ...form, body })}
            />
            <DashboardField
              label="Visible desde"
              value={form.starts_at ?? ''}
              onChangeText={(starts_at) => setForm({ ...form, starts_at })}
            />
            <DashboardField
              label="Visible hasta"
              value={form.ends_at ?? ''}
              onChangeText={(ends_at) => setForm({ ...form, ends_at })}
            />
            <View style={styles.imagePickerBlock}>
              <Text style={styles.inputLabel}>Imagen</Text>
              {form.image?.uri ? (
                <Image source={{ uri: form.image.uri }} style={styles.modalImagePreview} />
              ) : editingAnnouncement?.image_url ? (
                <Image source={{ uri: editingAnnouncement.image_url }} style={styles.modalImagePreview} />
              ) : null}
              <Pressable accessibilityRole="button" style={styles.imagePickerButton} onPress={pickImage}>
                <Camera color="#1b6fd7" size={17} strokeWidth={2.2} />
                <Text style={styles.imagePickerButtonText}>{form.image ? 'Cambiar imagen' : 'Elegir imagen'}</Text>
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Estado</Text>
            <View style={styles.choiceWrap}>
              <DashboardChoice label="Activo" selected={form.status !== 'inactivo'} onPress={() => setForm({ ...form, status: 'activo' })} />
              <DashboardChoice label="Inactivo" selected={form.status === 'inactivo'} onPress={() => setForm({ ...form, status: 'inactivo' })} />
            </View>

            {saveMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(saveMutation.error)}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable disabled={saveMutation.isPending} style={styles.cancelButton} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                disabled={saveMutation.isPending}
                style={StyleSheet.flatten([styles.primaryModalButton, saveMutation.isPending && styles.disabled])}
                onPress={() =>
                  saveMutation.mutate({
                    id: editingAnnouncement?.id,
                    input: {
                      ...form,
                      body: form.body.trim(),
                      ends_at: form.ends_at?.trim() || null,
                      starts_at: form.starts_at?.trim() || null,
                      title: form.title.trim(),
                    },
                  })
                }
              >
                {saveMutation.isPending ? <ActivityIndicator color="#ffffff" /> : <CheckCircle2 color="#ffffff" size={18} strokeWidth={2.3} />}
                <Text style={styles.primaryModalButtonText}>{saveMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function AdminMetricsBlock({ metrics }: { metrics: DashboardAdminMetric[] }) {
  return (
    <View style={styles.dashboardBlock}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <GraduationCap color="#1b6fd7" size={21} strokeWidth={2.2} />
        </View>
        <View style={styles.blockHeaderText}>
          <Text style={styles.blockEyebrow}>Metricas</Text>
          <Text style={styles.blockTitle}>Resumen y accesos directos</Text>
        </View>
      </View>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => {
          const Icon = metricIcon(metric.key);

          return (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Icon color="#1b6fd7" size={20} strokeWidth={2.2} />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                {metric.detail ? <Text style={styles.metricDetail}>{metric.detail}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AdminAnnouncementCard({
  announcement,
  busy,
  onDelete,
  onEdit,
  onToggleStatus,
}: {
  announcement: DashboardAdminAnnouncement;
  busy: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}) {
  const inactive = announcement.status !== 'activo';

  return (
    <View style={styles.announcementCard}>
      <View style={styles.announcementTitleRow}>
        <Text style={styles.announcementTitle}>{announcement.title}</Text>
        <Text style={StyleSheet.flatten([styles.statusPill, inactive ? styles.statusPillRead : styles.statusPillNew])}>
          {announcement.status_label}
        </Text>
      </View>
      <Text numberOfLines={3} style={styles.announcementBody}>{announcement.body}</Text>
      {announcement.image_url ? <Image source={{ uri: announcement.image_url }} style={styles.announcementImage} /> : null}
      <Text style={styles.blockMeta}>
        {announcement.starts_at ? `Desde ${announcement.starts_at}` : 'Sin fecha inicial'}
        {announcement.ends_at ? ` - Hasta ${announcement.ends_at}` : ''}
      </Text>
      <View style={styles.adminAnnouncementActions}>
        <Pressable style={styles.inlineButton} onPress={onEdit}>
          <Pencil color="#1b6fd7" size={16} strokeWidth={2.2} />
          <Text style={styles.inlineButtonText}>Editar</Text>
        </Pressable>
        <Pressable disabled={busy} style={StyleSheet.flatten([styles.inlineButton, busy && styles.disabled])} onPress={onToggleStatus}>
          <Unlock color="#1b6fd7" size={16} strokeWidth={2.2} />
          <Text style={styles.inlineButtonText}>{inactive ? 'Activar' : 'Inactivar'}</Text>
        </Pressable>
        <Pressable disabled={busy} style={StyleSheet.flatten([styles.inlineDangerButton, busy && styles.disabled])} onPress={onDelete}>
          <Trash2 color="#b42318" size={16} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function DashboardField({
  label,
  ...props
}: {
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#94a3b8"
        style={StyleSheet.flatten([styles.textInput, props.multiline && styles.textInputMultiline])}
        {...props}
      />
    </View>
  );
}

function DashboardChoice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return (
    <Pressable onPress={onPress} style={StyleSheet.flatten([styles.choice, selected && styles.choiceSelected])}>
      <Text style={StyleSheet.flatten([styles.choiceText, selected && styles.choiceTextSelected])}>{label}</Text>
    </Pressable>
  );
}

function DashboardBlocks({
  data,
  error,
  isError,
  isLoading,
  markReadId,
  onMarkRead,
  role,
}: {
  data?: Awaited<ReturnType<typeof getDashboard>>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  markReadId?: number;
  onMarkRead: (id: number) => void;
  role: 'student' | 'tutor';
}) {
  if (isLoading) {
    return (
      <View style={styles.dashboardBlock}>
        <ActivityIndicator />
        <Text style={styles.sessionText}>Cargando novedades...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.dashboardBlock}>
        <ScreenTitle icon="home" size="medium" text="No se pudo cargar el dashboard" />
        <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
      </View>
    );
  }

  const unreadAnnouncements = data?.announcements.data.filter((announcement) => !announcement.is_read) ?? [];

  return (
    <>
      {role === 'tutor' && data?.tutor_metrics?.length ? <TutorMetricsBlock metrics={data.tutor_metrics} /> : null}

      {data?.daily_verse ? (
        <View style={styles.dashboardBlock}>
          <View style={styles.blockHeader}>
            <View style={styles.blockIcon}>
              <Quote color="#1b6fd7" size={21} strokeWidth={2.2} />
            </View>
            <View style={styles.blockHeaderText}>
              <Text style={styles.blockEyebrow}>Versiculo del dia</Text>
              <Text style={styles.blockTitle}>{data.daily_verse.reference}</Text>
            </View>
          </View>
          <Text style={styles.verseText}>{data.daily_verse.text}</Text>
          <Text style={styles.blockMeta}>{data.daily_verse.version}</Text>
          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              router.push({
                pathname: '/biblia',
                params: {
                  book: String(data.daily_verse?.book.id),
                  chapter: String(data.daily_verse?.chapter.number),
                },
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Leer capitulo</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.dashboardBlock}>
        <View style={styles.blockHeader}>
          <View style={styles.blockIcon}>
            <Megaphone color="#1b6fd7" size={21} strokeWidth={2.2} />
          </View>
          <View style={styles.blockHeaderText}>
            <Text style={styles.blockEyebrow}>Anuncios</Text>
            <Text style={styles.blockTitle}>{role === 'tutor' ? 'Avisos generales y de tus usuarios' : 'Avisos generales y de tu tutor'}</Text>
          </View>
          {data?.announcements.unread_count ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{data.announcements.unread_count}</Text>
            </View>
          ) : null}
        </View>

        {unreadAnnouncements.length ? (
          <View style={styles.announcementList}>
            {unreadAnnouncements.slice(0, 3).map((announcement) => (
              <AnnouncementCard
                announcement={announcement}
                isMarkingRead={markReadId === announcement.id}
                key={announcement.id}
                onMarkRead={onMarkRead}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.blockMeta}>No hay anuncios pendientes.</Text>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/anuncios')}>
          <Text style={styles.secondaryButtonText}>Ver todos los anuncios</Text>
        </Pressable>
      </View>
    </>
  );
}

function TutorMetricsBlock({ metrics }: { metrics: DashboardTutorMetric[] }) {
  return (
    <View style={styles.dashboardBlock}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <GraduationCap color="#1b6fd7" size={21} strokeWidth={2.2} />
        </View>
        <View style={styles.blockHeaderText}>
          <Text style={styles.blockEyebrow}>Metricas</Text>
          <Text style={styles.blockTitle}>Resumen de acompanamiento</Text>
        </View>
      </View>
      <View style={styles.metricGrid}>
        {metrics.map((metric) => {
          const Icon = metricIcon(metric.key);

          return (
            <View key={metric.key} style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Icon color="#1b6fd7" size={20} strokeWidth={2.2} />
              </View>
              <View style={styles.metricText}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function metricIcon(key: string) {
  if (key === 'students') {
    return UsersRound;
  }

  if (key === 'tutors') {
    return UsersRound;
  }

  if (key === 'lessons') {
    return FileText;
  }

  if (key === 'completed_lessons') {
    return CheckCircle2;
  }

  if (key === 'announcements') {
    return Megaphone;
  }

  return GraduationCap;
}

function AnnouncementCard({
  announcement,
  isMarkingRead,
  onMarkRead,
}: {
  announcement: DashboardAnnouncement;
  isMarkingRead: boolean;
  onMarkRead: (id: number) => void;
}) {
  return (
    <View style={StyleSheet.flatten([styles.announcementCard, !announcement.is_read && styles.announcementCardUnread])}>
      <Pressable style={styles.announcementOpenArea} onPress={() => router.push(`/anuncios/${announcement.id}`)}>
        <View style={styles.announcementTitleRow}>
          <Text style={styles.announcementTitle}>{announcement.title}</Text>
          <Text
            style={StyleSheet.flatten([
              styles.statusPill,
              announcement.is_read ? styles.statusPillRead : styles.statusPillNew,
            ])}
          >
            {announcement.is_read ? 'Leido' : 'Nuevo'}
          </Text>
        </View>
        <Text style={styles.blockMeta}>
          {announcement.source_name} - {announcement.audience_label}
        </Text>
        <View style={styles.announcementReadMore}>
          <Text style={styles.announcementReadMoreText}>Abrir detalle</Text>
          <ChevronRight color="#1b6fd7" size={16} strokeWidth={2.4} />
        </View>
      </Pressable>
      {!announcement.is_read ? (
        <Pressable
          disabled={isMarkingRead}
          style={StyleSheet.flatten([styles.inlineAction, isMarkingRead && styles.inlineActionDisabled])}
          onPress={() => onMarkRead(announcement.id)}
        >
          <CheckCircle2 color="#1b6fd7" size={17} strokeWidth={2.2} />
          <Text style={styles.inlineActionText}>{isMarkingRead ? 'Marcando...' : 'Marcar como leido'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function confirmDeleteAdminAnnouncement(announcement: DashboardAdminAnnouncement, onConfirm: (id: number) => void) {
  Alert.alert('Eliminar anuncio', `Eliminar "${announcement.title}"?`, [
    { style: 'cancel', text: 'Cancelar' },
    { onPress: () => onConfirm(announcement.id), style: 'destructive', text: 'Eliminar' },
  ]);
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    padding: 28,
    paddingBottom: 112,
  },
  containerCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  brandPanel: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: '100%',
  },
  logo: {
    borderRadius: 24,
    height: 116,
    marginBottom: 4,
    width: 116,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroTitle: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#516070',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sessionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sessionText: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    textAlign: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
    width: '100%',
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 126,
    padding: 12,
  },
  quickButtonText: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  dashboardBlock: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginTop: 14,
    padding: 16,
    width: '100%',
  },
  iconActionButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  profilePrompt: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    marginBottom: 14,
    marginTop: 14,
    padding: 16,
    width: '100%',
  },
  profilePromptIcon: {
    alignItems: 'center',
    backgroundColor: '#ffedd5',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  profilePromptEyebrow: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  profilePromptMissing: {
    color: '#9a3412',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  profilePromptButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#fdba74',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  profilePromptButtonText: {
    color: '#9a3412',
    fontSize: 14,
    fontWeight: '900',
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  blockIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  blockHeaderText: {
    flex: 1,
    gap: 2,
  },
  blockEyebrow: {
    color: '#1b6fd7',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  blockTitle: {
    color: '#151922',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  verseText: {
    color: '#2f3947',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
  },
  blockMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 118,
    padding: 12,
  },
  metricIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  metricText: {
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
    width: '100%',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#151922',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    textAlign: 'center',
  },
  metricDetail: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    textAlign: 'center',
  },
  adminAnnouncementActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineButton: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: '#c7daf7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  inlineButtonText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  inlineDangerButton: {
    alignItems: 'center',
    backgroundColor: '#fff7f7',
    borderColor: '#ffd6d6',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 12,
  },
  disabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '800',
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: 10,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  announcementList: {
    gap: 10,
  },
  announcementCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  announcementOpenArea: {
    gap: 8,
  },
  announcementCardUnread: {
    backgroundColor: '#f7fbff',
    borderColor: '#9ec5fe',
  },
  announcementTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  announcementTitle: {
    color: '#151922',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
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
  announcementImage: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 128,
    width: '100%',
  },
  announcementBody: {
    color: '#42526a',
    fontSize: 14,
    lineHeight: 21,
  },
  announcementReadMore: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  announcementReadMoreText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
  },
  inlineAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  inlineActionDisabled: {
    opacity: 0.6,
  },
  inlineActionText: {
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
  smallLinkButton: {
    alignItems: 'center',
    backgroundColor: '#f2f4f7',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  smallLinkButtonText: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  formField: {
    gap: 6,
  },
  imagePickerBlock: {
    gap: 8,
  },
  imagePickerButton: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: '#c7daf7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  imagePickerButtonText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  modalImagePreview: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 150,
    width: '100%',
  },
  inputLabel: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
  },
  textInputMultiline: {
    minHeight: 104,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
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
  primaryModalButton: {
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
  primaryModalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CheckCircle2, Megaphone, Pencil, Plus, RefreshCcw, Trash2, Unlock, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import {
  AdminAnnouncementInput,
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncements,
  updateAdminAnnouncement,
  updateAdminAnnouncementStatus,
} from '../src/api/dashboard';
import { AppModal } from '../src/components/AppModal';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { DashboardAdminAnnouncement } from '../src/types/api';

const emptyForm: AdminAnnouncementInput = {
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

export default function AdminAnnouncementsScreen() {
  const queryClient = useQueryClient();
  const [editingAnnouncement, setEditingAnnouncement] = useState<DashboardAdminAnnouncement | null>(null);
  const [form, setForm] = useState<AdminAnnouncementInput>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: me });
  const announcementsQuery = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: getAdminAnnouncements,
    enabled: meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin',
  });

  const refreshAnnouncements = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AdminAnnouncementInput }) =>
      id ? updateAdminAnnouncement(id, input) : createAdminAnnouncement(input),
    onSuccess: async () => {
      closeModal();
      await refreshAnnouncements();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'activo' | 'inactivo' }) => updateAdminAnnouncementStatus(id, status),
    onSuccess: refreshAnnouncements,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminAnnouncement,
    onSuccess: refreshAnnouncements,
  });

  function openCreateModal() {
    setEditingAnnouncement(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(announcement: DashboardAdminAnnouncement) {
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
  }

  function closeModal() {
    setModalOpen(false);
    setEditingAnnouncement(null);
    setForm(emptyForm);
  }

  async function pickImage() {
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
  }

  function submitForm() {
    saveMutation.mutate({
      id: editingAnnouncement?.id,
      input: {
        ...form,
        body: form.body.trim(),
        ends_at: form.ends_at?.trim() || null,
        starts_at: form.starts_at?.trim() || null,
        title: form.title.trim(),
      },
    });
  }

  function confirmDelete(announcement: DashboardAdminAnnouncement) {
    Alert.alert('Eliminar anuncio', `Eliminar "${announcement.title}"?`, [
      { style: 'cancel', text: 'Cancelar' },
      { onPress: () => deleteMutation.mutate(announcement.id), style: 'destructive', text: 'Eliminar' },
    ]);
  }

  if (meQuery.isLoading) {
    return <CenteredState text="Cargando sesion..." />;
  }

  if (meQuery.data?.role !== 'admin' && meQuery.data?.role !== 'superadmin') {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="announcements" text="Anuncios" />
        <Text style={styles.error}>Esta seccion esta disponible solo para administradores.</Text>
      </View>
    );
  }

  if (announcementsQuery.isLoading) {
    return <CenteredState text="Cargando anuncios..." />;
  }

  if (announcementsQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="announcements" text="No se pudieron cargar los anuncios" />
        <Text style={styles.error}>{getApiErrorMessage(announcementsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => announcementsQuery.refetch()}>
          <RefreshCcw color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const busy = statusMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <FlatList
        contentContainerStyle={styles.list}
        data={announcementsQuery.data}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={announcementsQuery.isRefetching} onRefresh={announcementsQuery.refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <ScreenTitle icon="announcements" text="Anuncios" />
              <Pressable accessibilityRole="button" onPress={openCreateModal} style={styles.primaryButton}>
                <Plus color="#ffffff" size={18} strokeWidth={2.4} />
                <Text style={styles.primaryButtonText}>Nuevo</Text>
              </Pressable>
            </View>
            <Text style={styles.muted}>Todos los anuncios generales creados por el admin.</Text>
          </View>
        }
        ListEmptyComponent={<EmptyCard text="Todavia no hay anuncios creados." />}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            busy={busy}
            onDelete={() => confirmDelete(item)}
            onEdit={() => openEditModal(item)}
            onToggleStatus={() =>
              statusMutation.mutate({
                id: item.id,
                status: item.status === 'activo' ? 'inactivo' : 'activo',
              })
            }
          />
        )}
      />

      <AppModal backdropStyle={styles.centeredModalBackdrop} contentStyle={styles.centeredModalScroll} onClose={closeModal} transition="scale" visible={modalOpen}>
        <ScrollView contentContainerStyle={styles.centeredModalCard} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editingAnnouncement ? 'Editar anuncio' : 'Nuevo anuncio'}</Text>
              <Text style={styles.muted}>Aviso general visible para toda la app.</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={closeModal} style={styles.iconButton}>
              <X color="#151922" size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <Field label="Titulo" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
          <Field label="Mensaje" multiline value={form.body} onChangeText={(body) => setForm({ ...form, body })} />
          <Field label="Visible desde" value={form.starts_at ?? ''} onChangeText={(starts_at) => setForm({ ...form, starts_at })} />
          <Field label="Visible hasta" value={form.ends_at ?? ''} onChangeText={(ends_at) => setForm({ ...form, ends_at })} />

          <View style={styles.imagePickerBlock}>
            <Text style={styles.label}>Imagen</Text>
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

          <Text style={styles.label}>Estado</Text>
          <View style={styles.choiceWrap}>
            <Choice label="Activo" selected={form.status !== 'inactivo'} onPress={() => setForm({ ...form, status: 'activo' })} />
            <Choice label="Inactivo" selected={form.status === 'inactivo'} onPress={() => setForm({ ...form, status: 'inactivo' })} />
          </View>

          {saveMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(saveMutation.error)}</Text> : null}

          <View style={styles.modalActions}>
            <Pressable disabled={saveMutation.isPending} style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable disabled={saveMutation.isPending} style={[styles.primaryModalButton, saveMutation.isPending && styles.disabled]} onPress={submitForm}>
              {saveMutation.isPending ? <ActivityIndicator color="#ffffff" /> : <CheckCircle2 color="#ffffff" size={18} strokeWidth={2.3} />}
              <Text style={styles.primaryModalButtonText}>{saveMutation.isPending ? 'Guardando...' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AppModal>
    </>
  );
}

function AnnouncementCard({
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
    <View style={styles.card}>
      <View style={styles.cardTitleRow}>
        <View style={styles.cardTitleText}>
          <Text style={styles.cardTitle}>{announcement.title}</Text>
          <Text style={styles.meta}>
            {announcement.starts_at ? `Desde ${announcement.starts_at}` : 'Sin fecha inicial'}
            {announcement.ends_at ? ` - Hasta ${announcement.ends_at}` : ''}
          </Text>
        </View>
        <Text style={[styles.statusPill, inactive ? styles.statusPillInactive : styles.statusPillActive]}>
          {announcement.status_label}
        </Text>
      </View>
      <Text numberOfLines={4} style={styles.body}>{announcement.body}</Text>
      {announcement.image_url ? <Image source={{ uri: announcement.image_url }} style={styles.image} /> : null}
      <View style={styles.actionsRow}>
        <Pressable style={styles.inlineButton} onPress={onEdit}>
          <Pencil color="#1b6fd7" size={16} strokeWidth={2.2} />
          <Text style={styles.inlineButtonText}>Editar</Text>
        </Pressable>
        <Pressable disabled={busy} style={[styles.inlineButton, busy && styles.disabled]} onPress={onToggleStatus}>
          <Unlock color="#1b6fd7" size={16} strokeWidth={2.2} />
          <Text style={styles.inlineButtonText}>{inactive ? 'Activar' : 'Inactivar'}</Text>
        </Pressable>
        <Pressable disabled={busy} style={[styles.inlineDangerButton, busy && styles.disabled]} onPress={onDelete}>
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
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput autoCorrect={false} placeholder="" style={[styles.input, props.multiline && styles.textArea]} textAlignVertical={props.multiline ? 'top' : 'center'} {...props} />
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

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
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

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  body: {
    color: '#42526a',
    fontSize: 14,
    lineHeight: 21,
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
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
  cardTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  cardTitleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  cardTitleText: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  centeredModalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  centeredModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    gap: 12,
    padding: 18,
  },
  centeredModalScroll: {
    maxHeight: '92%',
    width: '100%',
  },
  choice: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#1b6fd7',
  },
  choiceText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '800',
  },
  choiceTextSelected: {
    color: '#1b4f91',
  },
  choiceWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    gap: 14,
    padding: 20,
  },
  disabled: {
    opacity: 0.6,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  field: {
    gap: 7,
  },
  header: {
    gap: 8,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  image: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 132,
    width: '100%',
  },
  imagePickerBlock: {
    gap: 8,
  },
  imagePickerButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f8fbff',
    borderColor: '#c7daf7',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  imagePickerButtonText: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '900',
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
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d0d5dd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '900',
  },
  list: {
    gap: 14,
    padding: 16,
    paddingBottom: 96,
  },
  meta: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  modalImagePreview: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 130,
    width: '100%',
  },
  modalTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
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
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
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
    minHeight: 44,
  },
  primaryModalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  statusPill: {
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillActive: {
    backgroundColor: '#fff4d6',
    color: '#8a5a00',
  },
  statusPillInactive: {
    backgroundColor: '#e8f1ff',
    color: '#1b4f91',
  },
  textArea: {
    minHeight: 100,
  },
});

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { Download, Eye, FileText, Image as ImageIcon, Pencil, Plus, RefreshCcw, Save, Trash2, Upload, Video, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  AdminDownloadableMaterialInput,
  createAdminDownloadableMaterial,
  deleteAdminDownloadableMaterial,
  getAdminDownloadableMaterials,
  updateAdminDownloadableMaterial,
} from '../src/api/adminPastoralContent';
import { me } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { AppModal } from '../src/components/AppModal';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { AdminDownloadableMaterial } from '../src/types/api';

type DownloadableFormState = {
  description: string;
  file: AdminDownloadableMaterialInput['file'];
  title: string;
};

const emptyForm: DownloadableFormState = {
  description: '',
  file: undefined,
  title: '',
};

export default function AdminDownloadableMaterialsScreen() {
  const queryClient = useQueryClient();
  const [editingMaterial, setEditingMaterial] = useState<AdminDownloadableMaterial | null>(null);
  const [form, setForm] = useState<DownloadableFormState>(emptyForm);
  const [formVisible, setFormVisible] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<AdminDownloadableMaterial | null>(null);

  const meQuery = useQuery({ queryKey: ['me'], queryFn: me });
  const materialsQuery = useQuery({
    queryKey: ['admin-downloadable-materials'],
    queryFn: getAdminDownloadableMaterials,
    enabled: meQuery.data?.role === 'admin' || meQuery.data?.role === 'superadmin',
  });

  const createMutation = useMutation({
    mutationFn: createAdminDownloadableMaterial,
    onSuccess: async () => {
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['admin-downloadable-materials'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AdminDownloadableMaterialInput }) => updateAdminDownloadableMaterial(id, input),
    onSuccess: async () => {
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['admin-downloadable-materials'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminDownloadableMaterial,
    onSuccess: async () => {
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['admin-downloadable-materials'] });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const formError = createMutation.error ?? updateMutation.error;

  useEffect(() => {
    if (!formVisible) {
      createMutation.reset();
      updateMutation.reset();
    }
  }, [createMutation, formVisible, updateMutation]);

  function openCreateForm() {
    setEditingMaterial(null);
    setForm(emptyForm);
    setFormVisible(true);
  }

  function openEditForm(material: AdminDownloadableMaterial) {
    setEditingMaterial(material);
    setForm({
      description: material.description ?? '',
      file: undefined,
      title: material.title,
    });
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingMaterial(null);
    setForm(emptyForm);
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setForm((current) => ({
      ...current,
      file: {
        mimeType: asset.mimeType,
        name: asset.name,
        uri: asset.uri,
      },
    }));
  }

  function submitForm() {
    const title = form.title.trim();

    if (!title) {
      Alert.alert('Falta el titulo', 'Ingresa un titulo para el contenido descargable.');
      return;
    }

    if (!editingMaterial && !form.file) {
      Alert.alert('Falta el archivo', 'Selecciona el archivo que queres subir.');
      return;
    }

    const input: AdminDownloadableMaterialInput = {
      description: form.description.trim() || null,
      file: form.file,
      title,
    };

    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, input });
      return;
    }

    createMutation.mutate(input);
  }

  function confirmDelete(material: AdminDownloadableMaterial) {
    Alert.alert('Eliminar contenido', `Se eliminara "${material.title}".`, [
      { style: 'cancel', text: 'Cancelar' },
      {
        onPress: () => deleteMutation.mutate(material.id),
        style: 'destructive',
        text: 'Eliminar',
      },
    ]);
  }

  if (meQuery.isLoading) {
    return <CenteredState text="Cargando sesion..." />;
  }

  if (meQuery.data?.role !== 'admin' && meQuery.data?.role !== 'superadmin') {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="content" text="Contenido descargable" />
        <Text style={styles.error}>Esta seccion esta disponible solo para administradores.</Text>
      </View>
    );
  }

  if (materialsQuery.isLoading) {
    return <CenteredState text="Cargando descargables..." />;
  }

  if (materialsQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="content" text="No se pudo cargar descargables" />
        <Text style={styles.error}>{getApiErrorMessage(materialsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => materialsQuery.refetch()}>
          <RefreshCcw color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.list}
        data={materialsQuery.data}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={materialsQuery.isRefetching} onRefresh={materialsQuery.refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerTitle}>
                <ScreenTitle icon="content" text="Contenido descargable" />
              </View>
              <Pressable accessibilityRole="button" onPress={openCreateForm} style={styles.primaryButton}>
                <Plus color="#ffffff" size={18} strokeWidth={2.4} />
                <Text style={styles.primaryButtonText}>Nuevo</Text>
              </Pressable>
            </View>
            <Text style={styles.muted}>Materiales publicados para pastores.</Text>
          </View>
        }
        ListEmptyComponent={<EmptyCard text="Todavia no hay contenido descargable cargado." />}
        renderItem={({ item }) => (
          <MaterialCard
            material={item}
            onEdit={() => openEditForm(item)}
            onPreview={() => setPreviewMaterial(item)}
          />
        )}
      />

      <AppModal contentStyle={styles.modalScroll} onClose={closeForm} transition="slide-right" visible={formVisible}>
        <ScrollView contentContainerStyle={styles.modalCard} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <ScreenTitle icon="content" size="medium" text={editingMaterial ? 'Editar descargable' : 'Nuevo descargable'} />
            <Pressable accessibilityRole="button" onPress={closeForm} style={styles.iconButton}>
              <X color="#151922" size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Titulo</Text>
            <TextInput
              autoCorrect={false}
              onChangeText={(title) => setForm((current) => ({ ...current, title }))}
              placeholder=""
              style={styles.input}
              value={form.title}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descripcion</Text>
            <TextInput
              autoCorrect={false}
              multiline
              onChangeText={(description) => setForm((current) => ({ ...current, description }))}
              placeholder=""
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={form.description}
            />
          </View>

          {!editingMaterial ? (
            <Pressable accessibilityRole="button" onPress={pickFile} style={styles.filePicker}>
              <Upload color="#1b6fd7" size={24} strokeWidth={2.3} />
              <View style={styles.filePickerText}>
                <Text style={styles.filePickerTitle}>Seleccionar archivo</Text>
                <Text numberOfLines={2} style={styles.muted}>
                  {form.file?.name ?? 'Imagen, video, PDF o documento'}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.existingFileBox}>
              <Text style={styles.label}>Archivo actual</Text>
              <Text style={styles.muted}>{editingMaterial.original_name ?? 'Sin nombre'}</Text>
            </View>
          )}

          {formError ? <Text style={styles.error}>{getApiErrorMessage(formError)}</Text> : null}

          <Pressable accessibilityRole="button" disabled={isSaving} onPress={submitForm} style={[styles.primaryButtonLarge, isSaving && styles.disabled]}>
            <Save color="#ffffff" size={18} strokeWidth={2.4} />
            <Text style={styles.primaryButtonText}>{isSaving ? 'Guardando...' : 'Guardar'}</Text>
          </Pressable>

          {editingMaterial ? (
            <Pressable
              accessibilityRole="button"
              disabled={deleteMutation.isPending}
              onPress={() => confirmDelete(editingMaterial)}
              style={[styles.dangerButtonLarge, deleteMutation.isPending && styles.disabled]}
            >
              <Trash2 color="#b42318" size={18} strokeWidth={2.3} />
              <Text style={styles.dangerButtonText}>{deleteMutation.isPending ? 'Eliminando...' : 'Eliminar archivo'}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </AppModal>

      <AppModal contentStyle={styles.previewModal} onClose={() => setPreviewMaterial(null)} transition="scale" visible={Boolean(previewMaterial)}>
        {previewMaterial ? (
          <View style={styles.previewCard}>
            <View style={styles.modalHeader}>
              <ScreenTitle icon="content" size="medium" text={previewMaterial.title} />
              <Pressable accessibilityRole="button" onPress={() => setPreviewMaterial(null)} style={styles.iconButton}>
                <X color="#151922" size={20} strokeWidth={2.4} />
              </Pressable>
            </View>
            <Text style={styles.meta}>
              {previewMaterial.type_label} · {formatBytes(previewMaterial.size ?? 0)}
            </Text>
            <View style={styles.previewFrame}>
              {previewMaterial.type === 'image' && previewMaterial.url ? (
                <Image resizeMode="contain" source={{ uri: previewMaterial.url }} style={styles.previewImage} />
              ) : previewMaterial.url ? (
                <WebView source={{ uri: previewMaterial.url }} style={styles.previewWebView} />
              ) : (
                <View style={styles.previewEmpty}>
                  <FileText color="#64748b" size={34} strokeWidth={2.1} />
                  <Text style={styles.muted}>El archivo no tiene una URL disponible.</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}
      </AppModal>
    </>
  );
}

function MaterialCard({
  material,
  onEdit,
  onPreview,
}: {
  material: AdminDownloadableMaterial;
  onEdit: () => void;
  onPreview: () => void;
}) {
  const Icon = materialIcon(material.type);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {material.thumb_url ? (
          <Image source={{ uri: material.thumb_url }} style={styles.thumb} />
        ) : (
          <View style={styles.fileIcon}>
            <Icon color="#1b6fd7" size={24} strokeWidth={2.2} />
          </View>
        )}
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{material.title}</Text>
          <Text style={styles.meta}>
            {material.type_label} · {formatBytes(material.size ?? 0)}
          </Text>
        </View>
        <Text style={[styles.badge, !material.is_published && styles.badgeMuted]}>
          {material.is_published ? 'Publicado' : 'Oculto'}
        </Text>
      </View>
      {material.description ? (
        <Text numberOfLines={3} style={styles.text}>
          {material.description}
        </Text>
      ) : null}
      <Text style={styles.meta}>Archivo: {material.original_name ?? 'Sin nombre'}</Text>

      <View style={styles.actionsRow}>
        <Pressable disabled={!material.url} style={[styles.secondaryButton, !material.url && styles.disabled]} onPress={onPreview}>
          <Eye color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Ver</Text>
        </Pressable>
        <Pressable disabled={!material.url} style={[styles.secondaryButton, !material.url && styles.disabled]} onPress={() => material.url && Linking.openURL(material.url)}>
          <Download color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Descargar</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onEdit}>
          <Pencil color="#151922" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryButtonText}>Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function materialIcon(type: string) {
  if (type === 'image') {
    return ImageIcon;
  }

  if (type === 'video') {
    return Video;
  }

  return FileText;
}

function formatBytes(bytes: number) {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;

  return `${value.toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
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
  badge: {
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    color: '#1b4f91',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeMuted: {
    backgroundColor: '#f2f4f7',
    color: '#667085',
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
    minWidth: 0,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 16,
    fontWeight: '900',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 14,
    padding: 20,
  },
  dangerButtonLarge: {
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderColor: '#fecdca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  dangerButtonText: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
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
  existingFileBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  field: {
    gap: 7,
  },
  fileIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  filePicker: {
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderColor: '#bdd7ff',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  filePickerText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  filePickerTitle: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  header: {
    gap: 8,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  headerTitle: {
    flex: 1,
    minWidth: 260,
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
  modalCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  modalScroll: {
    maxHeight: '88%',
    width: '100%',
  },
  muted: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    minWidth: 104,
    paddingHorizontal: 12,
  },
  primaryButtonLarge: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
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
  previewCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  previewEmpty: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 16,
  },
  previewFrame: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    height: 430,
    overflow: 'hidden',
    width: '100%',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  previewModal: {
    maxHeight: '90%',
    width: '100%',
  },
  previewWebView: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 94,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: '#151922',
    fontSize: 14,
    fontWeight: '900',
  },
  text: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
  },
  textArea: {
    minHeight: 96,
  },
  thumb: {
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    height: 48,
    width: 48,
  },
});

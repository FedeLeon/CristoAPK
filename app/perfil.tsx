import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { me, ProfileUpdateInput, updateProfile } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { ApiUser } from '../src/types/api';

type ProfileForm = {
  name: string;
  last_name: string;
  birth_date: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type SelectedAvatar = {
  name: string;
  type: string;
  uri: string;
};

const emptyForm: ProfileForm = {
  name: '',
  last_name: '',
  birth_date: '',
  phone: '',
  address: '',
  country: '',
  state: '',
  city: '',
  postal_code: '',
  email: '',
  password: '',
  password_confirmation: '',
};

function roleLabel(role?: string) {
  if (role === 'admin' || role === 'superadmin') {
    return 'Administrador';
  }

  if (role === 'tutor') {
    return 'Tutor';
  }

  if (role === 'student') {
    return 'Usuario';
  }

  return role ?? 'Sin rol';
}

function formFromUser(user: ApiUser): ProfileForm {
  return {
    name: user.first_name ?? user.name ?? '',
    last_name: user.last_name ?? '',
    birth_date: user.birth_date ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    country: user.country ?? '',
    state: user.state ?? '',
    city: user.city ?? '',
    postal_code: user.postal_code ?? '',
    email: user.email ?? '',
    password: '',
    password_confirmation: '',
  };
}

function filenameFromUri(uri: string) {
  return uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
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

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [avatar, setAvatar] = useState<SelectedAvatar | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (user) => {
      setForm(formFromUser(user));
      setAvatar(undefined);
      setStatusMessage('Perfil actualizado.');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      setForm(formFromUser(meQuery.data));
    }
  }, [meQuery.data]);

  async function pickAvatar() {
    setStatusMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusMessage('Necesitamos permiso para elegir una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const selected = result.assets[0];
    setAvatar({
      name: selected.fileName ?? filenameFromUri(selected.uri),
      type: selected.mimeType ?? mimeFromUri(selected.uri),
      uri: selected.uri,
    });
  }

  function updateField(field: keyof ProfileForm, value: string) {
    setStatusMessage(null);
    setForm((current) => ({ ...current, [field]: value }));
  }

  function saveProfile() {
    setStatusMessage(null);

    const payload: ProfileUpdateInput = {
      ...form,
      avatar,
    };

    if (!payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }

    updateMutation.mutate(payload);
  }

  if (meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando perfil...</Text>
      </View>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="profile" text="No se pudo cargar tu perfil" />
        {meQuery.error ? <Text style={styles.error}>{getApiErrorMessage(meQuery.error)}</Text> : null}
        <Pressable style={styles.secondaryButton} onPress={() => meQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  const user = meQuery.data;
  const avatarUri = avatar?.uri ?? user.avatar_url;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ScreenTitle icon="profile" text="Perfil" />
        <Text style={styles.muted}>Actualiza tus datos personales y credenciales.</Text>
      </View>

      {user.profile_completion_required && !user.profile_complete ? (
        <View style={styles.profileAlert}>
          <Text style={styles.profileAlertTitle}>Completa tu perfil</Text>
          <Text style={styles.profileAlertText}>
            Este aviso se mostrara al ingresar hasta que completes tus datos y subas una foto.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <Pressable style={styles.avatarButton} onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{user.avatar_initials ?? 'U'}</Text>
            )}
          </Pressable>
          <View style={styles.avatarText}>
            <Text style={styles.eyebrow}>{roleLabel(user.role)}</Text>
            <Text style={styles.avatarName}>{user.name}</Text>
            <Pressable style={styles.inlineButton} onPress={pickAvatar}>
              <Camera color="#1b6fd7" size={17} strokeWidth={2.2} />
              <Text style={styles.inlineButtonText}>Cambiar foto</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <ScreenTitle icon="profile" size="medium" text="Datos personales" />
        <ProfileInput label="Nombre" value={form.name} onChangeText={(value) => updateField('name', value)} />
        <ProfileInput label="Apellido" value={form.last_name} onChangeText={(value) => updateField('last_name', value)} />
        <ProfileInput
          label="Fecha de nacimiento"
          placeholder="AAAA-MM-DD"
          value={form.birth_date}
          onChangeText={(value) => updateField('birth_date', value)}
        />
        <ProfileInput
          label="Telefono"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => updateField('phone', value)}
        />
        <ProfileInput label="Direccion" value={form.address} onChangeText={(value) => updateField('address', value)} />
        <ProfileInput label="Pais" value={form.country} onChangeText={(value) => updateField('country', value)} />
        <ProfileInput
          label="Provincia / Estado"
          value={form.state}
          onChangeText={(value) => updateField('state', value)}
        />
        <ProfileInput label="Ciudad / Localidad" value={form.city} onChangeText={(value) => updateField('city', value)} />
        <ProfileInput
          label="Codigo postal"
          value={form.postal_code}
          onChangeText={(value) => updateField('postal_code', value)}
        />
      </View>

      <View style={styles.card}>
        <ScreenTitle icon="profile" size="medium" text="Email y contrasena" />
        <ProfileInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Correo electronico"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
        />
        <ProfileInput
          label="Nueva contrasena"
          secureTextEntry
          value={form.password}
          onChangeText={(value) => updateField('password', value)}
        />
        <ProfileInput
          label="Confirmar contrasena"
          secureTextEntry
          value={form.password_confirmation}
          onChangeText={(value) => updateField('password_confirmation', value)}
        />
      </View>

      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      {updateMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(updateMutation.error)}</Text> : null}

      <Pressable
        disabled={updateMutation.isPending}
        style={StyleSheet.flatten([styles.primaryButton, updateMutation.isPending && styles.primaryButtonDisabled])}
        onPress={saveProfile}
      >
        {updateMutation.isPending ? <ActivityIndicator color="#ffffff" /> : <Save color="#ffffff" size={18} strokeWidth={2.3} />}
        <Text style={styles.primaryButtonText}>{updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ProfileInput({
  label,
  ...inputProps
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#f6f7fb',
    flex: 1,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    gap: 16,
    padding: 16,
    paddingBottom: 112,
  },
  header: {
    gap: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarButton: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 88,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 88,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarInitials: {
    color: '#1b4f91',
    fontSize: 28,
    fontWeight: '900',
  },
  avatarText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  avatarName: {
    color: '#151922',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  eyebrow: {
    color: '#516070',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inlineButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  inlineButtonText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  profileAlert: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 14,
  },
  profileAlertTitle: {
    color: '#9a3412',
    fontSize: 16,
    fontWeight: '900',
  },
  profileAlertText: {
    color: '#9a3412',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  status: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
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

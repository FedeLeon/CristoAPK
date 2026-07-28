import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, MapPin, Save } from 'lucide-react-native';
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
import { getArgentinaCities, getArgentinaProvinces, getCountries, isArgentinaNationality, LocationOption } from '../src/api/locations';
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

type BirthDateParts = {
  day: string;
  month: string;
  year: string;
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

const emptyBirthDateParts: BirthDateParts = {
  day: '',
  month: '',
  year: '',
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

function parseBirthDate(value?: string | null): BirthDateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (!match) {
    return emptyBirthDateParts;
  }

  return {
    day: match[3],
    month: match[2],
    year: match[1],
  };
}

function normalizeDatePart(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

function composeBirthDate(parts: BirthDateParts) {
  const day = parts.day.padStart(2, '0');
  const month = parts.month.padStart(2, '0');

  if (!parts.day && !parts.month && !parts.year) {
    return '';
  }

  if (parts.year.length !== 4 || !parts.month || !parts.day) {
    return '';
  }

  return `${parts.year}-${month}-${day}`;
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [avatar, setAvatar] = useState<SelectedAvatar | undefined>();
  const [birthDateParts, setBirthDateParts] = useState<BirthDateParts>(emptyBirthDateParts);
  const [openSelect, setOpenSelect] = useState<'country' | 'state' | 'city' | null>(null);
  const [selectSearch, setSelectSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  const countriesQuery = useQuery({
    queryKey: ['location-countries'],
    queryFn: getCountries,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const provincesQuery = useQuery({
    queryKey: ['location-argentina-provinces'],
    queryFn: getArgentinaProvinces,
    enabled: isArgentinaNationality(form.country),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const citiesQuery = useQuery({
    queryKey: ['location-argentina-cities', form.state],
    queryFn: () => getArgentinaCities(form.state),
    enabled: isArgentinaNationality(form.country) && Boolean(form.state.trim()),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (user) => {
      const nextForm = formFromUser(user);
      setForm(nextForm);
      setBirthDateParts(parseBirthDate(nextForm.birth_date));
      setAvatar(undefined);
      setStatusMessage('Perfil actualizado.');
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      const nextForm = formFromUser(meQuery.data);
      setForm(nextForm);
      setBirthDateParts(parseBirthDate(nextForm.birth_date));
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
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === 'country' && !isArgentinaNationality(value)) {
        next.state = '';
        next.city = '';
      }

      if (field === 'state') {
        next.city = '';
      }

      return next;
    });
  }

  function updateOpenSelect(select: 'country' | 'state' | 'city' | null) {
    setOpenSelect(select);
    setSelectSearch('');
  }

  function updateBirthDatePart(field: keyof BirthDateParts, value: string) {
    setStatusMessage(null);
    setBirthDateParts((current) => ({
      ...current,
      [field]: normalizeDatePart(value, field === 'year' ? 4 : 2),
    }));
  }

  function saveProfile() {
    setStatusMessage(null);

    const payload: ProfileUpdateInput = {
      ...form,
      birth_date: composeBirthDate(birthDateParts),
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
        <BirthDateInputs parts={birthDateParts} onChangePart={updateBirthDatePart} />
        <ProfileInput
          label="Telefono"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(value) => updateField('phone', value)}
        />
        <ProfileInput label="Direccion (opcional)" value={form.address} onChangeText={(value) => updateField('address', value)} />
        <ProfileSelect
          emptyText="No se pudieron cargar nacionalidades."
          isLoading={countriesQuery.isLoading}
          label="Nacionalidad"
          onSelect={(option) => {
            updateField('country', option.value);
            updateOpenSelect(null);
          }}
          open={openSelect === 'country'}
          options={countriesQuery.data ?? []}
          placeholder="Seleccionar nacionalidad"
          search={openSelect === 'country' ? selectSearch : ''}
          setOpen={(open) => updateOpenSelect(open ? 'country' : null)}
          setSearch={setSelectSearch}
          value={form.country}
        />
        <ProfileSelect
          disabled={!isArgentinaNationality(form.country)}
          emptyText="Selecciona nacionalidad Argentina para cargar provincias."
          isLoading={provincesQuery.isLoading}
          label="Provincia"
          onSelect={(option) => {
            updateField('state', option.value);
            updateOpenSelect(null);
          }}
          open={openSelect === 'state'}
          options={provincesQuery.data ?? []}
          placeholder="Seleccionar provincia"
          search={openSelect === 'state' ? selectSearch : ''}
          setOpen={(open) => updateOpenSelect(open ? 'state' : null)}
          setSearch={setSelectSearch}
          value={form.state}
        />
        <ProfileSelect
          disabled={!isArgentinaNationality(form.country) || !form.state.trim()}
          emptyText="Selecciona una provincia para cargar ciudades."
          isLoading={citiesQuery.isLoading}
          label="Ciudad / Localidad"
          onSelect={(option) => {
            updateField('city', option.value);
            updateOpenSelect(null);
          }}
          open={openSelect === 'city'}
          options={citiesQuery.data ?? []}
          placeholder="Seleccionar ciudad"
          search={openSelect === 'city' ? selectSearch : ''}
          setOpen={(open) => updateOpenSelect(open ? 'city' : null)}
          setSearch={setSelectSearch}
          value={form.city}
        />
        <ProfileInput
          label="Codigo postal (opcional)"
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

function BirthDateInputs({
  onChangePart,
  parts,
}: {
  onChangePart: (field: keyof BirthDateParts, value: string) => void;
  parts: BirthDateParts;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Fecha de nacimiento</Text>
      <View style={styles.birthDateRow}>
        <DatePartInput label="Dia" maxLength={2} value={parts.day} onChangeText={(value) => onChangePart('day', value)} />
        <DatePartInput label="Mes" maxLength={2} value={parts.month} onChangeText={(value) => onChangePart('month', value)} />
        <DatePartInput label="Año" maxLength={4} value={parts.year} onChangeText={(value) => onChangePart('year', value)} />
      </View>
    </View>
  );
}

function DatePartInput({
  label,
  maxLength,
  onChangeText,
  value,
}: {
  label: string;
  maxLength: number;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.birthDatePart}>
      <Text style={styles.datePartLabel}>{label}</Text>
      <TextInput
        keyboardType="number-pad"
        maxLength={maxLength}
        placeholder={label === 'Dia' ? 'DD' : label === 'Mes' ? 'MM' : 'AAAA'}
        placeholderTextColor="#94a3b8"
        style={styles.datePartInput}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

function ProfileSelect({
  disabled,
  emptyText,
  isLoading,
  label,
  onSelect,
  open,
  options,
  placeholder,
  search,
  setOpen,
  setSearch,
  value,
}: {
  disabled?: boolean;
  emptyText: string;
  isLoading: boolean;
  label: string;
  onSelect: (option: LocationOption) => void;
  open: boolean;
  options: LocationOption[];
  placeholder: string;
  search: string;
  setOpen: (open: boolean) => void;
  setSearch: (value: string) => void;
  value: string;
}) {
  const selected = options.find((option) => option.value === value);
  const normalizedSearch = search
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const visibleOptions = normalizedSearch
    ? options.filter((option) =>
        `${option.label} ${option.value}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : options;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        disabled={disabled}
        style={StyleSheet.flatten([styles.selectButton, disabled && styles.selectButtonDisabled])}
        onPress={() => setOpen(!open)}
      >
        <View style={styles.selectValue}>
          {selected?.flag ? <Text style={styles.flagIcon}>{selected.flag}</Text> : <MapPin color="#64748b" size={17} strokeWidth={2.1} />}
          <Text numberOfLines={2} style={StyleSheet.flatten([styles.selectText, !value && styles.selectPlaceholder])}>
            {value || placeholder}
          </Text>
        </View>
        {isLoading ? <ActivityIndicator size="small" /> : <ChevronDown color="#64748b" size={18} strokeWidth={2.2} />}
      </Pressable>
      {open && !disabled ? (
        <View style={styles.selectMenu}>
          <TextInput
            autoCapitalize="words"
            placeholder="Buscar..."
            placeholderTextColor="#94a3b8"
            style={styles.selectSearch}
            value={search}
            onChangeText={setSearch}
          />
          {visibleOptions.length ? (
            <ScrollView nestedScrollEnabled style={styles.selectMenuScroll}>
              {visibleOptions.slice(0, 260).map((option) => (
                <Pressable key={`${option.code ?? option.value}-${option.value}`} style={styles.selectOption} onPress={() => onSelect(option)}>
                  {option.flag ? <Text style={styles.flagIcon}>{option.flag}</Text> : <MapPin color="#64748b" size={16} strokeWidth={2.1} />}
                  <Text style={styles.selectOptionText}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.selectEmpty}>{isLoading ? 'Cargando...' : search ? 'No hay resultados para esa busqueda.' : emptyText}</Text>
          )}
        </View>
      ) : null}
    </View>
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
  birthDateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  birthDatePart: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  datePartLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  datePartInput: {
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    fontWeight: '800',
    minHeight: 48,
    paddingHorizontal: 8,
    paddingVertical: 10,
    textAlign: 'center',
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
  selectButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectValue: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    minWidth: 0,
  },
  selectText: {
    color: '#151922',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  selectPlaceholder: {
    color: '#94a3b8',
  },
  flagIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  selectMenu: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectSearch: {
    backgroundColor: '#f8fafc',
    borderBottomColor: '#dce2ea',
    borderBottomWidth: 1,
    color: '#151922',
    fontSize: 15,
    fontWeight: '700',
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectMenuScroll: {
    maxHeight: 260,
  },
  selectOption: {
    alignItems: 'center',
    borderBottomColor: '#edf1f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectOptionText: {
    color: '#151922',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  selectEmpty: {
    color: '#606b7a',
    fontSize: 14,
    lineHeight: 20,
    padding: 12,
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

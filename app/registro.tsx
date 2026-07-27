import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, Check, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getApiErrorMessage } from '../src/api/client';
import { register, type RegisterInput } from '../src/api/auth';

type RegisterRole = RegisterInput['role'];

export default function RegisterScreen() {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<RegisterRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const registerMutation = useMutation({
    mutationFn: () =>
      register({
        email: email.trim(),
        name: name.trim(),
        password,
        password_confirmation: passwordConfirmation,
        role,
      }),
    onSuccess: async (response) => {
      if (response.token) {
        await queryClient.invalidateQueries();
        router.replace('/');
        return;
      }

      setSuccessMessage(response.message ?? 'Registro recibido.');
    },
  });

  const canSubmit = Boolean(name.trim() && email.trim() && password && passwordConfirmation);

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandHeader}>
          <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
          <Text style={styles.appTitle}>MENSAJE DE SALVACION</Text>
          <View style={styles.titleRow}>
            <UserPlus color="#1b6fd7" size={22} strokeWidth={2.2} />
            <Text style={styles.title}>Crear cuenta</Text>
          </View>
        </View>

        {successMessage ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Registro recibido</Text>
            <Text style={styles.noticeText}>{successMessage}</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
              <Text style={styles.primaryButtonText}>Volver al login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.text}>Elegí el tipo de cuenta y completa tus datos para empezar.</Text>

            <View style={styles.roleGrid}>
              <RoleOption
                description="Accede a contenidos de ayuda, encuentros en vivo y materiales."
                label="Usuario"
                onPress={() => setRole('student')}
                selected={role === 'student'}
              />
              <RoleOption
                description="Solicita acceso pastoral. Un admin debe habilitar la cuenta."
                label="Pastor"
                onPress={() => setRole('pastor')}
                selected={role === 'pastor'}
              />
            </View>

            <Field label="Nombre" onChangeText={setName} placeholder="Tu nombre" value={name} />
            <Field
              autoCapitalize="none"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="usuario@example.com"
              value={email}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Contrasena</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setPassword}
                  placeholder="Minimo 8 caracteres"
                  secureTextEntry={!showPassword}
                  style={styles.passwordTextInput}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  accessibilityRole="button"
                  onPress={() => setShowPassword((current) => !current)}
                  style={styles.iconButton}
                >
                  {showPassword ? (
                    <EyeOff color="#516070" size={22} strokeWidth={2.2} />
                  ) : (
                    <Eye color="#516070" size={22} strokeWidth={2.2} />
                  )}
                </Pressable>
              </View>
            </View>

            <Field
              label="Confirmar contrasena"
              onChangeText={setPasswordConfirmation}
              placeholder="Repeti la misma contrasena"
              secureTextEntry={!showPassword}
              value={passwordConfirmation}
            />

            {registerMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(registerMutation.error)}</Text> : null}

            <Pressable
              disabled={!canSubmit || registerMutation.isPending}
              onPress={() => registerMutation.mutate()}
              style={[styles.primaryButton, (!canSubmit || registerMutation.isPending) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>
                {registerMutation.isPending ? 'Registrando...' : 'Registrarme'}
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.backButton}>
          <ArrowLeft color="#1b6fd7" size={18} strokeWidth={2.2} />
          <Text style={styles.backButtonText}>Volver al login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  ...props
}: {
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94a3b8" style={styles.input} {...props} />
    </View>
  );
}

function RoleOption({
  description,
  label,
  onPress,
  selected,
}: {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.roleOption, selected && styles.roleOptionSelected]}
    >
      <View style={[styles.checkBox, selected && styles.checkBoxSelected]}>
        {selected ? <Check color="#ffffff" size={14} strokeWidth={2.8} /> : null}
      </View>
      <View style={styles.roleText}>
        <Text style={styles.roleTitle}>{label}</Text>
        <Text style={styles.roleDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  appTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 6,
  },
  backButtonText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  brandHeader: {
    alignItems: 'center',
    gap: 10,
  },
  checkBox: {
    alignItems: 'center',
    borderColor: '#94a3b8',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkBoxSelected: {
    backgroundColor: '#1b6fd7',
    borderColor: '#1b6fd7',
  },
  disabledButton: {
    opacity: 0.55,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 7,
  },
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '700',
  },
  logo: {
    height: 104,
    width: 104,
  },
  notice: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  noticeText: {
    color: '#516070',
    fontSize: 15,
    lineHeight: 22,
  },
  noticeTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
  },
  panel: {
    gap: 16,
  },
  passwordInput: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
  },
  passwordTextInput: {
    color: '#151922',
    flex: 1,
    fontSize: 16,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  roleDescription: {
    color: '#516070',
    fontSize: 13,
    lineHeight: 18,
  },
  roleGrid: {
    gap: 10,
  },
  roleOption: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  roleOptionSelected: {
    backgroundColor: '#e8f1ff',
    borderColor: '#8bbcf0',
  },
  roleText: {
    flex: 1,
    gap: 3,
  },
  roleTitle: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '900',
  },
  screen: {
    backgroundColor: '#f6f7fb',
    flex: 1,
  },
  scroll: {
    gap: 18,
    justifyContent: 'center',
    padding: 24,
    paddingVertical: 32,
  },
  text: {
    color: '#516070',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    color: '#151922',
    fontSize: 26,
    fontWeight: '900',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
});

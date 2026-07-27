import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import { clearRememberedEmail, getRememberedEmail, setRememberedEmail } from '../src/auth/rememberedEmailStorage';
import { ScreenTitle } from '../src/components/ScreenTitle';

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getRememberedEmail().then((storedEmail) => {
      if (!isMounted || !storedEmail) {
        return;
      }

      setEmail(storedEmail);
      setRememberEmail(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async () => {
      if (rememberEmail) {
        await setRememberedEmail(email.trim());
      } else {
        await clearRememberedEmail();
      }

      await queryClient.invalidateQueries();
      router.replace('/');
    },
  });

  const toggleRememberEmail = async () => {
    const nextValue = !rememberEmail;
    setRememberEmail(nextValue);

    if (!nextValue) {
      await clearRememberedEmail();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.screen}
    >
      <View style={styles.panel}>
        <ScreenTitle icon="login" text="Ingresar" />
        <Text style={styles.text}>Ingresa con el email y la contraseña de tu rol.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="usuario@example.com"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              placeholder="usuario1234"
              secureTextEntry={!showPassword}
              style={styles.passwordTextInput}
              value={password}
            />
            <Pressable
              accessibilityLabel={showPassword ? 'Ocultar password' : 'Mostrar password'}
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

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberEmail }}
          onPress={toggleRememberEmail}
          style={styles.rememberRow}
        >
          <View style={[styles.checkbox, rememberEmail && styles.checkboxChecked]}>
            {rememberEmail ? <Check color="#ffffff" size={15} strokeWidth={3} /> : null}
          </View>
          <Text style={styles.rememberText}>Recordar usuario</Text>
        </Pressable>

        {loginMutation.isError ? (
          <Text style={styles.error}>{getApiErrorMessage(loginMutation.error)}</Text>
        ) : null}

        <Pressable
          disabled={!email.trim() || !password || loginMutation.isPending}
          onPress={() => loginMutation.mutate()}
          style={[
            styles.primaryButton,
            (!email.trim() || !password || loginMutation.isPending) && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  panel: {
    gap: 16,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
  },
  text: {
    color: '#516070',
    fontSize: 15,
    lineHeight: 22,
  },
  field: {
    gap: 7,
  },
  label: {
    color: '#2f3947',
    fontSize: 14,
    fontWeight: '700',
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
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  rememberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 2,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#94a3b8',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: '#1b6fd7',
    borderColor: '#1b6fd7',
  },
  rememberText: {
    color: '#2f3947',
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
});

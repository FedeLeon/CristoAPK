import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';
import {
  clearRememberedEmail,
  getRememberedUser,
  setRememberedUser,
  type RememberedUser,
} from '../src/auth/rememberedEmailStorage';

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const passwordInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [rememberedUser, setRememberedUserState] = useState<RememberedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getRememberedUser().then((storedUser) => {
      if (!isMounted || !storedUser) {
        return;
      }

      setEmail(storedUser.email);
      setRememberedUserState(storedUser);
      setRememberEmail(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const loginMutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async (user) => {
      if (rememberEmail) {
        await setRememberedUser({
          avatar_color: user.avatar_color,
          avatar_initials: user.avatar_initials,
          avatar_url: user.avatar_url,
          email: email.trim(),
          name: user.name,
        });
      } else {
        await clearRememberedEmail();
      }

      await queryClient.invalidateQueries();
      router.replace('/');
    },
  });

  const canSubmit = Boolean(email.trim() && password && !loginMutation.isPending);

  const submitLogin = () => {
    if (canSubmit) {
      loginMutation.mutate();
    }
  };

  const toggleRememberEmail = async () => {
    const nextValue = !rememberEmail;
    setRememberEmail(nextValue);

    if (!nextValue) {
      await clearRememberedEmail();
      setRememberedUserState(null);
    }
  };

  const clearRememberedUser = async () => {
    await clearRememberedEmail();
    setEmail('');
    setPassword('');
    setRememberEmail(false);
    setRememberedUserState(null);
  };

  const hasRememberedUser = Boolean(rememberedUser && email);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.screen}
    >
      <View style={styles.panel}>
        <View style={styles.brandHeader}>
          <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
          <Text style={styles.appTitle}>MENSAJE DE SALVACION</Text>
          <View style={styles.loginTitleRow}>
            <LogIn color="#1b6fd7" size={22} strokeWidth={2.2} />
            <Text style={styles.loginTitle}>Ingresar</Text>
          </View>
        </View>
        {hasRememberedUser ? (
          <View style={styles.rememberedWelcome}>
            <View style={[styles.rememberedAvatar, !rememberedUser?.avatar_url && { backgroundColor: rememberedUser?.avatar_color ?? '#1b6fd7' }]}>
              {rememberedUser?.avatar_url ? (
                <Image source={{ uri: rememberedUser.avatar_url }} style={styles.rememberedAvatarImage} />
              ) : (
                <Text style={styles.rememberedAvatarText}>
                  {rememberedUser?.avatar_initials ?? rememberedUser?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </Text>
              )}
            </View>
            <Text style={styles.welcomeEyebrow}>Bienvenido</Text>
            <Text style={styles.welcomeName}>{rememberedUser?.name}</Text>
            <Pressable accessibilityRole="button" onPress={clearRememberedUser} style={styles.changeUserButton}>
              <Text style={styles.changeUserText}>Cambiar usuario</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.text}>Ingresa con el email y la contraseña de tu rol.</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                importantForAutofill="no"
                keyboardType="email-address"
                onChangeText={setEmail}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                returnKeyType="next"
                spellCheck={false}
                submitBehavior="submit"
                style={styles.input}
                textContentType="none"
                value={email}
              />
            </View>
          </>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              ref={passwordInputRef}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              onChangeText={setPassword}
              onSubmitEditing={submitLogin}
              returnKeyType="done"
              secureTextEntry={!showPassword}
              spellCheck={false}
              submitBehavior="blurAndSubmit"
              style={styles.passwordTextInput}
              textContentType="none"
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

        <Pressable accessibilityRole="link" onPress={() => router.push('/olvide-mi-contrasena')} style={styles.inlineLink}>
          <KeyRound color="#1b6fd7" size={17} strokeWidth={2.2} />
          <Text style={styles.inlineLinkText}>Olvide mi contrasena</Text>
        </Pressable>

        {loginMutation.isError ? (
          <Text style={styles.error}>{getApiErrorMessage(loginMutation.error)}</Text>
        ) : null}

        <Pressable
          disabled={!canSubmit}
          onPress={submitLogin}
          style={[
            styles.primaryButton,
            !canSubmit && styles.disabledButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
          </Text>
        </Pressable>

        <Pressable accessibilityRole="link" onPress={() => router.push('/registro')} style={styles.secondaryAction}>
          <UserPlus color="#1b6fd7" size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryActionText}>Registrarme</Text>
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
  appTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  loginTitle: {
    color: '#151922',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  loginTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  logo: {
    height: 116,
    width: 116,
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
  inlineLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 7,
    paddingVertical: 2,
  },
  inlineLinkText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '800',
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
  changeUserButton: {
    alignSelf: 'center',
    paddingVertical: 2,
  },
  changeUserText: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  rememberedAvatar: {
    alignItems: 'center',
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 84,
  },
  rememberedAvatarImage: {
    height: '100%',
    width: '100%',
  },
  rememberedAvatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  rememberedWelcome: {
    alignItems: 'center',
    gap: 7,
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
  secondaryAction: {
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
  secondaryActionText: {
    color: '#1b6fd7',
    fontSize: 15,
    fontWeight: '900',
  },
  welcomeEyebrow: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeName: {
    color: '#151922',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 32,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
});

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { login } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginMutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.replace('/');
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.screen}
    >
      <View style={styles.panel}>
        <Text style={styles.title}>Ingresar</Text>
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
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="usuario1234"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

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

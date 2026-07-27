import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { forgotPassword } from '../src/api/auth';
import { getApiErrorMessage } from '../src/api/client';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const forgotMutation = useMutation({
    mutationFn: () => forgotPassword(email.trim()),
    onSuccess: (response) => {
      setSuccessMessage(response.message);
    },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.screen}>
      <View style={styles.panel}>
        <View style={styles.brandHeader}>
          <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
          <Text style={styles.appTitle}>MENSAJE DE SALVACION</Text>
          <View style={styles.titleRow}>
            <KeyRound color="#1b6fd7" size={22} strokeWidth={2.2} />
            <Text style={styles.title}>Recuperar contrasena</Text>
          </View>
        </View>

        <Text style={styles.text}>Ingresa tu email y te enviaremos un enlace para cambiarla.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="usuario@example.com"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={email}
          />
        </View>

        {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
        {forgotMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(forgotMutation.error)}</Text> : null}

        <Pressable
          disabled={!email.trim() || forgotMutation.isPending}
          onPress={() => forgotMutation.mutate()}
          style={[styles.primaryButton, (!email.trim() || forgotMutation.isPending) && styles.disabledButton]}
        >
          <Text style={styles.primaryButtonText}>{forgotMutation.isPending ? 'Enviando...' : 'Enviar enlace'}</Text>
        </Pressable>

        <Pressable accessibilityRole="link" onPress={() => router.replace('/login')} style={styles.backButton}>
          <ArrowLeft color="#1b6fd7" size={18} strokeWidth={2.2} />
          <Text style={styles.backButtonText}>Volver al login</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  panel: {
    gap: 16,
    justifyContent: 'center',
    padding: 24,
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
  screen: {
    backgroundColor: '#f6f7fb',
    flex: 1,
    justifyContent: 'center',
  },
  success: {
    backgroundColor: '#ecfdf3',
    borderColor: '#bbf7d0',
    borderRadius: 8,
    borderWidth: 1,
    color: '#087443',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    padding: 12,
  },
  text: {
    color: '#516070',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    color: '#151922',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
});

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { AlertTriangle, HeartHandshake, MessageCircle, Quote, Send, UserPlus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getApiErrorMessage } from '../src/api/client';
import { requestPastoralGuidance, requestPastoralSupport } from '../src/api/pastoral';
import { ScreenTitle } from '../src/components/ScreenTitle';
import { PastoralGuidanceResponse } from '../src/types/api';

type PastoralSupportResult = Awaited<ReturnType<typeof requestPastoralSupport>>;

const PASTORAL_GUIDANCE_MAX_LENGTH = 700;

export default function PastoralGuidanceScreen() {
  const [concern, setConcern] = useState('');
  const guidanceMutation = useMutation({
    mutationFn: requestPastoralGuidance,
  });

  const supportMutation = useMutation({
    mutationFn: requestPastoralSupport,
    onSuccess: (response) => {
      if (response.action === 'chat' && response.conversation_id) {
        router.push(`/chat/${response.conversation_id}`);
        return;
      }
    },
  });

  const canSend = concern.trim().length > 0 && !guidanceMutation.isPending;

  function submit() {
    const trimmedConcern = concern.trim();

    if (!trimmedConcern) {
      return;
    }

    guidanceMutation.mutate(trimmedConcern);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <ScreenTitle icon="pastoral" text="Orientacion pastoral" />
        <Text style={styles.muted}>
          Escribi una inquietud espiritual, emocional o biblica para recibir una orientacion breve, versiculos y una oracion.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <HeartHandshake color="#1b6fd7" size={23} strokeWidth={2.2} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Tu inquietud</Text>
            <Text style={styles.cardMeta}>No incluyas datos personales sensibles.</Text>
          </View>
        </View>

        <TextInput
          multiline
          maxLength={PASTORAL_GUIDANCE_MAX_LENGTH}
          onChangeText={setConcern}
          placeholder="Ejemplo: Estoy atravesando ansiedad y necesito recordar que dice la Biblia sobre la paz."
          placeholderTextColor="#94a3b8"
          style={styles.textarea}
          textAlignVertical="top"
          value={concern}
        />

        <View style={styles.inputFooter}>
          <Text style={styles.counter}>
            {concern.length}/{PASTORAL_GUIDANCE_MAX_LENGTH}
          </Text>
          <Pressable
            disabled={!canSend}
            onPress={submit}
            style={StyleSheet.flatten([styles.primaryButton, !canSend && styles.primaryButtonDisabled])}
          >
            {guidanceMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Send color="#ffffff" size={18} strokeWidth={2.3} />
            )}
            <Text style={styles.primaryButtonText}>
              {guidanceMutation.isPending ? 'Consultando...' : 'Recibir orientacion'}
            </Text>
          </Pressable>
        </View>
      </View>

      {guidanceMutation.isError ? (
        <View style={styles.errorCard}>
          <AlertTriangle color="#b42318" size={21} strokeWidth={2.2} />
          <Text style={styles.errorText}>{getApiErrorMessage(guidanceMutation.error)}</Text>
        </View>
      ) : null}

      {guidanceMutation.data ? <GuidanceResult result={guidanceMutation.data} supportMutation={supportMutation} /> : null}
    </ScrollView>
  );
}

function GuidanceResult({
  result,
  supportMutation,
}: {
  result: PastoralGuidanceResponse;
  supportMutation: UseMutationResult<PastoralSupportResult, Error, void>;
}) {
  return (
    <View style={styles.resultGroup}>
      {result.critical ? (
        <View style={styles.criticalCard}>
          <AlertTriangle color="#b42318" size={21} strokeWidth={2.2} />
          <Text style={styles.criticalText}>
            Si estas en riesgo inmediato o pensas en hacerte dano, busca ayuda humana urgente y habla con tu tutor/lider o una persona de confianza.
          </Text>
        </View>
      ) : null}

      {!result.ok && result.error ? (
        <View style={styles.errorCard}>
          <AlertTriangle color="#b42318" size={21} strokeWidth={2.2} />
          <Text style={styles.errorText}>{result.error}</Text>
        </View>
      ) : null}

      {result.orientation ? (
        <View style={styles.resultCard}>
          <SectionHeader icon={<MessageCircle color="#1b6fd7" size={20} strokeWidth={2.2} />} title="Orientacion breve" />
          <Text style={styles.resultText}>{result.orientation}</Text>
        </View>
      ) : null}

      <View style={styles.resultCard}>
        <SectionHeader icon={<Quote color="#1b6fd7" size={20} strokeWidth={2.2} />} title="Versiculos recomendados" />
        {result.verses.length ? (
          <View style={styles.verseList}>
            {result.verses.map((verse) => (
              <View key={`${verse.reference}-${verse.text}`} style={styles.verseItem}>
                <Text style={styles.verseReference}>{verse.reference}</Text>
                <Text style={styles.verseText}>{verse.text}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.cardMeta}>No encontramos versiculos locales para esta inquietud.</Text>
        )}
      </View>

      {result.prayer ? (
        <View style={styles.resultCard}>
          <SectionHeader icon={<HeartHandshake color="#1b6fd7" size={20} strokeWidth={2.2} />} title="Oracion sugerida" />
          <Text style={styles.resultText}>{result.prayer}</Text>
        </View>
      ) : null}

      {result.recommend_tutor ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Te recomendamos hablar con tu tutor/lider para recibir acompanamiento personal y oracion.
          </Text>
          <Pressable
            disabled={supportMutation.isPending}
            onPress={() => supportMutation.mutate()}
            style={StyleSheet.flatten([styles.supportButton, supportMutation.isPending && styles.primaryButtonDisabled])}
          >
            {supportMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : result.has_tutor ? (
              <MessageCircle color="#ffffff" size={18} strokeWidth={2.3} />
            ) : (
              <UserPlus color="#ffffff" size={18} strokeWidth={2.3} />
            )}
            <Text style={styles.primaryButtonText}>
              {supportMutation.isPending
                ? 'Enviando...'
                : result.has_tutor
                  ? 'Chatear con mi tutor'
                  : 'Me gustaria tener un tutor'}
            </Text>
          </Pressable>
          {supportMutation.data?.action === 'requested' ? <Text style={styles.supportStatus}>{supportMutation.data.message}</Text> : null}
          {supportMutation.isError ? <Text style={styles.supportError}>{getApiErrorMessage(supportMutation.error)}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>{icon}</View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    gap: 16,
    padding: 16,
    paddingBottom: 112,
  },
  header: {
    gap: 6,
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  cardIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '900',
  },
  cardMeta: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  textarea: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    lineHeight: 21,
    minHeight: 170,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputFooter: {
    gap: 10,
  },
  counter: {
    alignSelf: 'flex-end',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  resultGroup: {
    gap: 12,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sectionTitle: {
    color: '#151922',
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
  },
  resultText: {
    color: '#2f3947',
    fontSize: 15,
    lineHeight: 22,
  },
  verseList: {
    gap: 10,
  },
  verseItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  verseReference: {
    color: '#1b6fd7',
    fontSize: 14,
    fontWeight: '900',
  },
  verseText: {
    color: '#2f3947',
    fontSize: 14,
    lineHeight: 21,
  },
  errorCard: {
    alignItems: 'flex-start',
    backgroundColor: '#fff7f7',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 14,
  },
  errorText: {
    color: '#b42318',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  criticalCard: {
    alignItems: 'flex-start',
    backgroundColor: '#fff7f7',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 14,
  },
  criticalText: {
    color: '#991b1b',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  infoText: {
    color: '#1e3a8a',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  supportButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  supportError: {
    color: '#b42318',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  supportStatus: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
});

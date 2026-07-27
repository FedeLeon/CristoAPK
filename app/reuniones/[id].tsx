import { useQuery } from '@tanstack/react-query';
import { createElement } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getApiErrorMessage } from '../../src/api/client';
import { getMeetings } from '../../src/api/meetings';
import { useLocalSearchParams } from 'expo-router';
import { ScreenTitle } from '../../src/components/ScreenTitle';

function formatMeetingDate(value?: string | null) {
  if (!value) {
    return 'Fecha sin definir';
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isValidWebUrl(value?: string | null): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function buildMdsJitsiUrl(value: string, subject: string) {
  const [baseUrl, hash = ''] = value.split('#');
  const preservedHash = hash
    .split('&')
    .filter(Boolean)
    .filter((item) => {
      const [key] = item.split('=');
      return key !== 'userInfo.displayName' && key !== 'config.subject';
    });

  const brandedHash = [
    ...preservedHash,
    `userInfo.displayName=${encodeURIComponent(JSON.stringify('MDS'))}`,
    `config.subject=${encodeURIComponent(JSON.stringify(subject || 'MDS'))}`,
  ];

  return `${baseUrl}#${brandedHash.join('&')}`;
}

export default function MeetingRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const meetingsQuery = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  });

  const meeting = meetingsQuery.data?.find((item) => String(item.id) === String(id));
  const roomUrl = meeting?.jitsi_room_url;

  if (meetingsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Abriendo reunion...</Text>
      </View>
    );
  }

  if (meetingsQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="meetings" text="No se pudo abrir la reunion" />
        <Text style={styles.error}>{getApiErrorMessage(meetingsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => meetingsQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!meeting || !isValidWebUrl(roomUrl)) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="meetings" text="Reunion no disponible" />
        <Text style={styles.muted}>Esta reunion no tiene una sala valida configurada.</Text>
      </View>
    );
  }

  const brandedRoomUrl = buildMdsJitsiUrl(roomUrl, meeting.title);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <ScreenTitle icon="meetings" size="medium" text={meeting.title} />
        <Text style={styles.date}>{formatMeetingDate(meeting.scheduled_for)}</Text>
      </View>

      <View style={styles.room}>
        {Platform.OS === 'web' ? (
          createElement('iframe', {
            allow: 'camera; microphone; fullscreen; display-capture; autoplay',
            src: brandedRoomUrl,
            style: styles.webFrame,
            title: meeting.title,
          })
        ) : (
          <WebView
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            domStorageEnabled
            javaScriptCanOpenWindowsAutomatically
            javaScriptEnabled
            mediaCapturePermissionGrantType="grant"
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']}
            source={{ uri: brandedRoomUrl }}
            startInLoadingState
            style={styles.webView}
            thirdPartyCookiesEnabled
            renderLoading={() => (
              <View style={styles.webLoading}>
                <ActivityIndicator />
                <Text style={styles.muted}>Conectando con la sala...</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    gap: 16,
    padding: 24,
  },
  screen: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#dce2ea',
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '800',
  },
  date: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '800',
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#b42318',
    fontSize: 15,
    lineHeight: 22,
  },
  room: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  webFrame: {
    borderWidth: 0,
    flex: 1,
    height: '100%',
    width: '100%',
  },
  webLoading: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
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

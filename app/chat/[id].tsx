import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { me } from '../../src/api/auth';
import { getChat, sendChatMessage } from '../../src/api/chats';
import { getApiErrorMessage } from '../../src/api/client';
import { ScreenTitle } from '../../src/components/ScreenTitle';

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const chatQuery = useQuery({
    queryKey: ['chat', id],
    queryFn: () => getChat(id),
    enabled: Boolean(id),
  });

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendChatMessage(id, body.trim()),
    onSuccess: async () => {
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['chat', id] });
      await queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  if (chatQuery.isLoading || meQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando chat...</Text>
      </View>
    );
  }

  if (chatQuery.isError || meQuery.isError) {
    const error = chatQuery.error ?? meQuery.error;

    return (
      <View style={styles.container}>
        <ScreenTitle icon="chat" text="No se pudo cargar el chat" />
        <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => chatQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <ScreenTitle icon="chat" text={chatQuery.data?.title ?? 'Chat'} />
        <Text style={styles.muted}>{chatQuery.data?.type === 'group' ? 'Conversacion grupal' : 'Conversacion directa'}</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={[...(chatQuery.data?.messages ?? [])].reverse()}
        inverted
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.muted}>Todavia no hay mensajes.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMine = item.user?.id === meQuery.data?.id;
          const avatarUrl = item.user?.avatar_url;
          const avatarInitials = item.user?.avatar_initials || item.user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';
          const avatarColor = item.user?.avatar_color || '#12365c';

          return (
            <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowOther]}>
              <View style={[styles.messageContentRow, isMine && styles.messageContentRowMine]}>
                <View style={[styles.messageAvatar, !avatarUrl && { backgroundColor: avatarColor }]}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.messageAvatarImage} />
                  ) : (
                    <Text style={styles.messageAvatarText}>{avatarInitials}</Text>
                  )}
                </View>
                <View style={styles.messageContent}>
                  <Text style={[styles.messageAuthor, isMine ? styles.messageAuthorMine : styles.messageAuthorOther]}>
                    {isMine ? 'Vos' : item.user?.name ?? 'Usuario'}
                  </Text>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.messageBody, isMine ? styles.messageBodyMine : styles.messageBodyOther]}>
                      {item.body}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        {sendMutation.isError ? <Text style={styles.error}>{getApiErrorMessage(sendMutation.error)}</Text> : null}
        <View style={styles.composerRow}>
          <TextInput
            multiline
            onChangeText={setBody}
            placeholder="Escribir mensaje..."
            style={styles.input}
            value={body}
          />
          <Pressable
            disabled={!body.trim() || sendMutation.isPending}
            onPress={() => sendMutation.mutate()}
            style={[styles.sendButton, (!body.trim() || sendMutation.isPending) && styles.disabledButton]}
          >
            <Text style={styles.sendButtonText}>{sendMutation.isPending ? '...' : 'Enviar'}</Text>
          </Pressable>
        </View>
      </View>
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
    flex: 1,
    gap: 16,
    padding: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  header: {
    backgroundColor: '#f6f7fb',
    borderBottomColor: '#dce2ea',
    borderBottomWidth: 1,
    gap: 5,
    padding: 16,
  },
  title: {
    color: '#151922',
    fontSize: 24,
    fontWeight: '800',
  },
  muted: {
    color: '#606b7a',
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  messageRow: {
    marginVertical: 6,
    maxWidth: '92%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageRowOther: {
    alignSelf: 'flex-start',
  },
  messageContentRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 7,
  },
  messageContentRowMine: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 32,
  },
  messageAvatarImage: {
    height: '100%',
    width: '100%',
  },
  messageAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  messageContent: {
    flexShrink: 1,
    gap: 4,
  },
  messageAuthor: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 4,
  },
  messageAuthorMine: {
    alignSelf: 'flex-end',
    color: '#1b4f91',
    textAlign: 'right',
  },
  messageAuthorOther: {
    alignSelf: 'flex-start',
    color: '#64748b',
    textAlign: 'left',
  },
  bubble: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'relative',
  },
  bubbleMine: {
    backgroundColor: '#1b6fd7',
  },
  bubbleOther: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderWidth: 1,
  },
  messageBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageBodyMine: {
    color: '#ffffff',
  },
  messageBodyOther: {
    color: '#2f3947',
  },
  composer: {
    backgroundColor: '#ffffff',
    borderTopColor: '#dce2ea',
    borderTopWidth: 1,
    gap: 8,
    padding: 12,
  },
  composerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    flex: 1,
    fontSize: 15,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
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

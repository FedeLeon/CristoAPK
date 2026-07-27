import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { me } from '../../src/api/auth';
import { getChats } from '../../src/api/chats';
import { getApiErrorMessage } from '../../src/api/client';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { ChatConversation } from '../../src/types/api';

function getInitial(value?: string | null) {
  return value?.trim().charAt(0).toUpperCase() || 'C';
}

function getChatAvatar(conversation: ChatConversation, currentUserId?: number) {
  if (conversation.type === 'group') {
    return {
      color: '#12365c',
      initials: getInitial(conversation.title),
      url: null,
    };
  }

  const participant =
    conversation.participants?.find((item) => item.id !== currentUserId) ?? conversation.participants?.[0];

  return {
    color: participant?.avatar_color || '#12365c',
    initials: participant?.avatar_initials || getInitial(participant?.name ?? conversation.title),
    url: participant?.avatar_url ?? null,
  };
}

export default function ChatScreen() {
  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
  });
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });

  if (chatsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.muted}>Cargando chats...</Text>
      </View>
    );
  }

  if (chatsQuery.isError) {
    return (
      <View style={styles.container}>
        <ScreenTitle icon="chat" text="No se pudieron cargar tus chats" />
        <Text style={styles.error}>{getApiErrorMessage(chatsQuery.error)}</Text>
        <Pressable style={styles.secondaryButton} onPress={() => chatsQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={chatsQuery.data}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={chatsQuery.isRefetching} onRefresh={chatsQuery.refetch} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <ScreenTitle icon="chat" text="Chat" />
          <Text style={styles.muted}>Conversaciones disponibles para tu usuario.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.cardTitle}>Sin conversaciones</Text>
          <Text style={styles.muted}>No tenes chats disponibles por el momento.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Link href={`/chat/${item.id}`} asChild>
          <Pressable style={styles.card}>
            <ChatAvatar conversation={item} currentUserId={meQuery.data?.id} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>{item.type === 'group' ? 'Grupo' : 'Directo'}</Text>
              {item.last_message ? (
                <Text numberOfLines={2} style={styles.text}>
                  {item.last_message.body}
                </Text>
              ) : (
                <Text style={styles.text}>Sin mensajes todavia.</Text>
              )}
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

function ChatAvatar({ conversation, currentUserId }: { conversation: ChatConversation; currentUserId?: number }) {
  const avatar = getChatAvatar(conversation, currentUserId);

  return (
    <View style={[styles.avatar, !avatar.url && { backgroundColor: avatar.color }]}>
      {avatar.url ? (
        <Image source={{ uri: avatar.url }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{avatar.initials}</Text>
      )}
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
  list: {
    gap: 12,
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    gap: 6,
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
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    padding: 16,
  },
  cardContent: {
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 48,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  empty: {
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  cardTitle: {
    color: '#151922',
    fontSize: 18,
    fontWeight: '800',
  },
  meta: {
    color: '#1b6fd7',
    fontSize: 13,
    fontWeight: '800',
  },
  text: {
    color: '#516070',
    fontSize: 14,
    lineHeight: 20,
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

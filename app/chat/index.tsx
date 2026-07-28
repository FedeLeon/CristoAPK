import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { MessageCirclePlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { me } from '../../src/api/auth';
import { createDirectChat, getChatCandidates, getChats } from '../../src/api/chats';
import { getApiErrorMessage } from '../../src/api/client';
import { AppModal } from '../../src/components/AppModal';
import { ScreenTitle } from '../../src/components/ScreenTitle';
import { ApiUser, ChatConversation } from '../../src/types/api';

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
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
  });
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: me,
  });
  const candidatesQuery = useQuery({
    queryKey: ['chat-candidates'],
    queryFn: getChatCandidates,
    enabled: isCreateModalOpen,
  });
  const createChatMutation = useMutation({
    mutationFn: createDirectChat,
    onSuccess: async (conversation) => {
      setIsCreateModalOpen(false);
      setSearch('');
      await queryClient.invalidateQueries({ queryKey: ['chats'] });
      router.push(`/chat/${conversation.id}`);
    },
  });

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const candidates = candidatesQuery.data ?? [];

    if (!normalizedSearch) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const value = `${candidate.name} ${candidate.email} ${candidate.role ?? ''}`.toLowerCase();

      return value.includes(normalizedSearch);
    });
  }, [candidatesQuery.data, search]);

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
    <>
      <FlatList
        contentContainerStyle={styles.list}
        data={chatsQuery.data}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={chatsQuery.isRefetching} onRefresh={chatsQuery.refetch} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTitleText}>
                <ScreenTitle icon="chat" text="Chat" />
                <Text style={styles.muted}>Conversaciones disponibles para tu usuario.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsCreateModalOpen(true)}
                style={styles.newChatButton}
              >
                <MessageCirclePlus color="#ffffff" size={19} strokeWidth={2.3} />
                <Text style={styles.newChatButtonText}>Nuevo</Text>
              </Pressable>
            </View>
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
            <Pressable style={StyleSheet.flatten([styles.card, Boolean(item.unread_count) && styles.cardUnread])}>
              <ChatAvatar conversation={item} currentUserId={meQuery.data?.id} />
              <View style={styles.cardContent}>
                <View style={styles.cardTitleRow}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
                  {item.unread_count ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unread_count > 99 ? '99+' : item.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
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
      <NewDirectChatModal
        candidates={filteredCandidates}
        error={candidatesQuery.error ?? createChatMutation.error}
        isCreating={createChatMutation.isPending}
        isLoading={candidatesQuery.isLoading}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSearch('');
        }}
        onRetry={() => candidatesQuery.refetch()}
        onSearch={setSearch}
        onSelect={(candidate) => createChatMutation.mutate(candidate.id)}
        search={search}
        visible={isCreateModalOpen}
      />
    </>
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

function roleLabel(role?: string | null) {
  if (role === 'admin' || role === 'superadmin') {
    return 'Admin';
  }

  if (role === 'tutor') {
    return 'Tutor';
  }

  if (role === 'pastor') {
    return 'Pastor';
  }

  return 'Usuario';
}

function NewDirectChatModal({
  candidates,
  error,
  isCreating,
  isLoading,
  onClose,
  onRetry,
  onSearch,
  onSelect,
  search,
  visible,
}: {
  candidates: ApiUser[];
  error: unknown;
  isCreating: boolean;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSearch: (value: string) => void;
  onSelect: (candidate: ApiUser) => void;
  search: string;
  visible: boolean;
}) {
  return (
    <AppModal contentStyle={styles.createModal} onClose={onClose} transition="slide-up" visible={visible}>
      <View style={styles.createModalHeader}>
        <ScreenTitle icon="chat" size="medium" text="Nuevo chat" />
        <Text style={styles.muted}>Elegí una persona habilitada para iniciar una conversación individual.</Text>
      </View>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onSearch}
        placeholder="Buscar por nombre, email o rol"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
        value={search}
      />

      {isLoading ? (
        <View style={styles.modalCenter}>
          <ActivityIndicator />
          <Text style={styles.muted}>Cargando usuarios...</Text>
        </View>
      ) : error ? (
        <View style={styles.modalCenter}>
          <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
          <Pressable style={styles.secondaryButton} onPress={onRetry}>
            <Text style={styles.secondaryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : candidates.length ? (
        <ScrollView contentContainerStyle={styles.candidateList} keyboardShouldPersistTaps="handled">
          {candidates.map((candidate) => (
            <Pressable
              accessibilityRole="button"
              disabled={isCreating}
              key={candidate.id}
              onPress={() => onSelect(candidate)}
              style={[styles.candidateCard, isCreating && styles.disabledCard]}
            >
              <UserAvatar user={candidate} />
              <View style={styles.candidateContent}>
                <Text numberOfLines={1} style={styles.candidateName}>{candidate.name}</Text>
                <Text numberOfLines={1} style={styles.candidateMeta}>{candidate.email}</Text>
              </View>
              <Text style={styles.rolePill}>{roleLabel(candidate.role)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.modalCenter}>
          <Text style={styles.cardTitle}>Sin usuarios disponibles</Text>
          <Text style={styles.muted}>No hay personas habilitadas para iniciar un chat individual.</Text>
        </View>
      )}
    </AppModal>
  );
}

function UserAvatar({ user }: { user: ApiUser }) {
  return (
    <View style={[styles.avatar, !user.avatar_url && { backgroundColor: user.avatar_color ?? '#12365c' }]}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{user.avatar_initials || getInitial(user.name)}</Text>
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
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitleText: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  newChatButton: {
    alignItems: 'center',
    backgroundColor: '#12365c',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  newChatButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
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
  cardUnread: {
    borderColor: '#93c5fd',
    borderWidth: 2,
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
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  cardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  unreadBadge: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 16,
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
  createModal: {
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    maxHeight: '86%',
    maxWidth: 520,
    padding: 16,
    width: '100%',
  },
  createModalHeader: {
    gap: 6,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#c3cfdd',
    borderRadius: 8,
    borderWidth: 1,
    color: '#151922',
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalCenter: {
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  candidateList: {
    gap: 8,
  },
  candidateCard: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 64,
    padding: 10,
  },
  disabledCard: {
    opacity: 0.64,
  },
  candidateContent: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    color: '#151922',
    fontSize: 15,
    fontWeight: '900',
  },
  candidateMeta: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rolePill: {
    backgroundColor: '#e8f1ff',
    borderRadius: 8,
    color: '#12365c',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});

import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { getChats } from '../../src/api/chats';
import { getApiErrorMessage } from '../../src/api/client';

export default function ChatScreen() {
  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
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
        <Text style={styles.title}>No se pudieron cargar tus chats</Text>
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
          <Text style={styles.title}>Chat</Text>
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
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.type === 'group' ? 'Grupo' : 'Directo'}</Text>
            {item.last_message ? (
              <Text numberOfLines={2} style={styles.text}>
                {item.last_message.body}
              </Text>
            ) : (
              <Text style={styles.text}>Sin mensajes todavia.</Text>
            )}
          </Pressable>
        </Link>
      )}
    />
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
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    padding: 16,
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 30,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#f6f7fb' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'CristoApp' }} />
        <Stack.Screen name="login" options={{ title: 'Ingresar' }} />
        <Stack.Screen name="cursos/index" options={{ title: 'Cursos' }} />
        <Stack.Screen name="cursos/[id]" options={{ title: 'Curso' }} />
        <Stack.Screen name="biblia/index" options={{ title: 'Biblia' }} />
      </Stack>
    </QueryClientProvider>
  );
}

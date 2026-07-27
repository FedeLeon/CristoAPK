import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brandPanel}>
        <Image source={require('../assets/brand/mds-dove-black.png')} style={styles.logo} />
        <Text style={styles.title}>Bienvenido a MDS</Text>
        <Text style={styles.subtitle}>Mensaje de salvacion</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
        <Text style={styles.primaryButtonText}>Ingresar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f6f7fb',
    justifyContent: 'center',
    padding: 28,
  },
  brandPanel: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dce2ea',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 28,
    width: '100%',
  },
  logo: {
    borderRadius: 24,
    height: 116,
    marginBottom: 4,
    width: 116,
  },
  title: {
    color: '#151922',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#516070',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b6fd7',
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

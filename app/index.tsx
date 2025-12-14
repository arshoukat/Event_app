import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function HomeScreen() {
  useEffect(() => {
    console.log('HomeScreen mounted');
  }, []);

  // Simple test - if this shows, the app is working
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.testBox}>
        <Text style={styles.testText}>✓ App is Loading!</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome to Event App</Text>
        <Text style={styles.subtitle}>
          React Native + Expo
        </Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ✓ React Native with Expo
          </Text>
          <Text style={styles.infoText}>
            ✓ TypeScript support
          </Text>
          <Text style={styles.infoText}>
            ✓ iOS & Android ready
          </Text>
          <Text style={styles.infoText}>
            ✓ Modern mobile development
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  infoContainer: {
    width: '100%',
    maxWidth: 300,
  },
  infoText: {
    fontSize: 16,
    color: '#444',
    marginVertical: 8,
    paddingLeft: 10,
  },
  testBox: {
    backgroundColor: '#34C759',
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  testText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});


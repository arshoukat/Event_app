import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../contexts/LanguageContext';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="home" />
        <Stack.Screen name="event-detail" />
        <Stack.Screen name="ticket-booking" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="my-events" />
        <Stack.Screen name="tickets" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="create-event" />
        <Stack.Screen name="forgot-password" />
      </Stack>
      <Toast />
    </LanguageProvider>
  );
}


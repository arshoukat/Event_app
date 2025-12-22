import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to login screen on app start
  // In a real app, you'd check authentication state here
  return <Redirect href="/login" />;
}


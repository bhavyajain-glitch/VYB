import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import UpdateChecker from '../components/UpdateChecker';
import WebAuthHandler from '../components/WebAuthHandler';
import AuthGuard from '../components/AuthGuard';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <UpdateChecker />
      <WebAuthHandler>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="profile-setup" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="dating-profile-setup" />
            <Stack.Screen name="create-post" options={{ presentation: 'modal' }} />
            <Stack.Screen name="post/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </AuthGuard>
      </WebAuthHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

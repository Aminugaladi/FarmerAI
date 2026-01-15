import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

// Shigo da Firebase Auth
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Tabbatar path din nan daidai yake

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const segments = useSegments();

  // 1. Bibiyar yanayin Login (Auth State)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 2. Tura mutum inda ya dace (Navigation Logic)
  useEffect(() => {
    if (initializing) return;

    // Duba idan mutum yana cikin shafukan (tabs) ko a waje (login/register)
    const inTabsGroup = segments[0] === '(tabs)';

    if (!user && inTabsGroup) {
      // Idan ba login kuma yana son shiga (tabs), tura shi login
      router.replace('/login');
    } else if (user && (segments[0] === 'login' || segments[0] === 'register')) {
      // Idan yana da login amma yana kokarin komawa shafin shiga, tura shi (tabs)
      router.replace('/(tabs)');
    }
  }, [user, initializing, segments]);

  // Nuna alamar loading yayin da ake duba login
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FFF9' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Wadannan sune shafukan da za a iya gani */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Bayani' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}
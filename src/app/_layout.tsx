import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '../context/AppContext';
import '../global.css';

// NavigationGate protects screens based on the user's authentication state
function NavigationGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isAlertPage = segments[0] === 'alert';

    // Redirect to login if user is unauthenticated and attempting to visit app tabs/alerts
    if (!user && (inTabsGroup || isAlertPage)) {
      router.replace('/(auth)/login');
    }
    // Redirect to app home if user is authenticated and attempting to visit onboarding/login
    else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-50 justify-center items-center">
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <NavigationGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F9FAFB' },
            animation: 'slide_from_right',
          }}
        >
          {/* Dispatcher/Splash Screen */}
          <Stack.Screen name="index" options={{ headerShown: false }} />
          
          {/* Auth Flow */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          
          {/* Main Application Tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          
          {/* Modal-style SOS Alert Screen (Contact View) */}
          <Stack.Screen 
            name="alert" 
            options={{ 
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom'
            }} 
          />
        </Stack>
      </NavigationGate>
    </AppProvider>
  );
}

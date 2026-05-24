import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { EyeOff } from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useApp();
  
  // Custom premium micro-animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run animations in parallel
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();

    // Small rotating glow pulse
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Wait and dispatch
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 px-8">
      {/* Background Calm Ambient Radial Glow (simulated) */}
      <View className="absolute w-80 h-80 rounded-full bg-primary-100/30 blur-3xl" style={{ top: '25%' }} />

      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: 'center',
        }}
        className="flex-col items-center justify-center"
      >
        {/* Safe Innocent Shield and Hidden Eye Logo */}
        <View className="w-24 h-24 rounded-[32px] bg-white border border-neutral-100 items-center justify-center shadow-md mb-6 relative">
          <View className="absolute w-[86px] h-[86px] rounded-[28px] border border-primary-100/50" />
          <EyeOff size={42} color="#1a56db" strokeWidth={1.5} />
        </View>

        {/* Clean, Elegant Typography */}
        <Text className="text-3xl font-extrabold text-neutral-800 tracking-tight pl-1">
          Silent<Text className="text-primary-500">SOS</Text>
        </Text>
        
        <Text className="text-sm font-medium text-neutral-400 mt-2 tracking-wide text-center">
          Safety hidden in plain sight
        </Text>
      </Animated.View>

      {/* Very subtle status indicator */}
      <View className="absolute bottom-16 flex-row items-center space-x-1.5">
        <View className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-ping" />
        <Text className="text-[10px] font-semibold text-neutral-300 uppercase tracking-widest pl-1">
          Secured Connection
        </Text>
      </View>
    </View>
  );
}

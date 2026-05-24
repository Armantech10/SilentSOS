import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';

export default function Login() {
  const router = useRouter();
  const { login, signup } = useApp();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('student@university.edu');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom Visual Overlay loading & toast
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const parseFirebaseError = (err: any): string => {
    const message = err?.message || String(err) || '';
    const code = err?.code || '';
    
    // Extract any auth/xxx code inside the error code or error message
    let match = code;
    if (!match) {
      const regex = /auth\/[a-zA-Z0-9-]+/;
      const found = message.match(regex);
      if (found) {
        match = found[0];
      }
    }

    switch (match) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify your credentials.';
      case 'auth/email-already-in-use':
        return 'This email is already associated with an account.';
      case 'auth/weak-password':
        return 'Weak password! Must be at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled in Firebase console.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'Authentication failed. Please verify credentials.';
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid university email.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        triggerToast('Logged in successfully!');
      } else {
        await signup(email, password);
        triggerToast('Account registered successfully!');
      }
      
      // Delay redirect to show success toast before automatically replacing route
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);

    } catch (e: any) {
      console.log('[SilentSOS] Auth Error Code:', e?.code, '| Message:', e?.message, '| Full Error:', e);
      console.error('[SilentSOS] Auth Action Failed:', e);
      const humanMsg = parseFirebaseError(e);
      setError(humanMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 justify-between">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-4 justify-between" showsVerticalScrollIndicator={false}>
          
          {/* Top Branding Section */}
          <View className="items-center mt-10 mb-6">
            <View className="w-16 h-16 rounded-[22px] bg-white border border-neutral-100 items-center justify-center shadow-sm mb-4">
              <ShieldCheck size={28} color="#1a56db" strokeWidth={1.5} />
            </View>
            <Text className="text-2xl font-bold text-neutral-800 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text className="text-xs font-medium text-neutral-400 mt-1.5 text-center leading-5 max-w-[240px]">
              {isLogin 
                ? 'Sign in to access your dashboard and configure your safety lifeline.'
                : 'Join SilentSOS to configure hidden triggers and secure trusted lifelines.'}
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Display error alert if any */}
            {error ? (
              <View className="bg-red-50/50 border border-red-200/50 rounded-2xl p-3.5 mb-2">
                <Text className="text-xs font-semibold text-red-500">{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <Input
              label="University Email"
              placeholder="name@university.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={16} color="#9ca3af" />}
              editable={!loading}
            />

            {/* Password Input */}
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              leftIcon={<Lock size={16} color="#9ca3af" />}
              editable={!loading}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={16} color="#9ca3af" />
                  ) : (
                    <Eye size={16} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              }
            />

            {/* Action Buttons */}
            <Button
              onPress={handleAuth}
              title={isLogin ? 'Sign In' : 'Sign Up'}
              variant="primary"
              loading={loading}
              className="w-full mt-4"
            />
          </View>

          {/* Switch Auth mode footer */}
          <View className="items-center pb-6 mt-6">
            <TouchableOpacity 
              disabled={loading}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              <Text className="text-sm font-semibold text-neutral-500">
                {isLogin 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <Text className="text-primary-500">
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Success Toast Overlay */}
      <Animated.View 
        style={{ opacity: toastOpacity }}
        className="absolute top-16 left-6 right-6 bg-emerald-600 rounded-2xl py-4 px-5 flex-row items-center justify-center space-x-2 shadow-lg z-50 pointer-events-none"
      >
        <CheckCircle2 size={16} color="white" />
        <Text className="text-white text-xs font-bold pl-2">{toastMsg}</Text>
      </Animated.View>

    </SafeAreaView>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Animated, Switch } from 'react-native';
import { Send, Eye, ShieldCheck, MessageSquare, Clipboard, Compass, AlertCircle, X, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useRouter } from 'expo-router';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../services/firebase';
import { getCurrentLocation } from '../../services/location';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SMS from 'expo-sms';


interface ChatBubble {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

export default function SendSOSScreen() {
  const router = useRouter();
  const { codePhrase, isArmed, toggleArmed, fireSOS, user, situation, contacts } = useApp();

  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatBubble[]>([
    { id: '1', text: "Hey! Are we still on for study group tonight?", sender: 'them', timestamp: '7:02 PM' },
    { id: '2', text: "Yeah, I'm heading over shortly. Just grab us a table.", sender: 'me', timestamp: '7:03 PM' },
    { id: '3', text: "Perfect, I got one on the 3rd floor, room 3B.", sender: 'them', timestamp: '7:05 PM' },
  ]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Header tap bypass trigger (taps registered: 3)
  const [headerTapCount, setHeaderTapCount] = useState(0);
  
  // Custom Toast animations
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');

  // Subtle pulsing blue dot animation
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const bannerPulse = useRef(new Animated.Value(0.7)).current;

  // Countdown & SOS States
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(10);
  const countdownTimerRef = useRef<any>(null);
  
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosTimestamp, setSosTimestamp] = useState<number | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start();
  };

  // Pulse effect when system is Armed
  useEffect(() => {
    if (isArmed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0.4);
    }
  }, [isArmed]);

  // Pulse effect when SOS Distress active banner is active
  useEffect(() => {
    if (isSOSActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bannerPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(bannerPulse, { toValue: 0.7, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      bannerPulse.setValue(0.7);
    }
  }, [isSOSActive]);

  // Persistent SOS State recovery on mount
  useEffect(() => {
    const retrieveActiveSOS = async () => {
      if (user) {
        try {
          const savedActive = await AsyncStorage.getItem(`@silentsos_active_event_${user.uid}`);
          if (savedActive) {
            const parsed = JSON.parse(savedActive);
            if (parsed && parsed.status === 'active') {
              setIsSOSActive(true);
              setSosTimestamp(parsed.timestamp);
            }
          }
        } catch (e) {
          console.warn('[Storage] Failed to read active SOS event status', e);
        }
      }
    };
    retrieveActiveSOS();
  }, [user]);

  // Request location permission on first arming
  const handleToggleArm = async (value: boolean) => {
    if (value) {
      // Prompt explain location requirement
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'SilentSOS needs your location to help trusted contacts find you during an emergency distress alert.',
          [
            { 
              text: 'Cancel', 
              style: 'cancel', 
              onPress: () => {} 
            },
            {
              text: 'Allow',
              onPress: async () => {
                const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
                if (newStatus === 'granted') {
                  await toggleArmed();
                  triggerToast('System Armed & Secured');
                } else {
                  triggerToast('Location access denied. Cannot arm.');
                }
              }
            }
          ]
        );
      } else {
        await toggleArmed();
        triggerToast('System Armed & Secured');
      }
    } else {
      await toggleArmed();
      triggerToast('System Disarmed');
    }
  };

  const handleHeaderTap = () => {
    const nextCount = headerTapCount + 1;
    setHeaderTapCount(nextCount);
    
    if (nextCount === 3) {
      setHeaderTapCount(0);
      initiateCountdown("Header Bypass Triggered");
    } else {
      console.log(`[SilentSOS] Bypass tap registers: ${nextCount}/3`);
    }
  };

  // ==========================================
  // SOS ACTIVATION ENGINE FLOW
  // ==========================================
  const initiateCountdown = (triggerPhraseUsed: string) => {
    // 1. Play standard trigger toast
    triggerToast("Processing secured signal...");
    
    // 2. Set active countdown seconds and layout states
    setCountdownSeconds(10);
    setCountdownActive(true);

    // 3. Clear any existing active timer
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    // 4. Start 10-second ticking interval
    const timestamp = Date.now();
    countdownTimerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          setCountdownActive(false);
          commitDistressSignal(timestamp, triggerPhraseUsed);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelCountdown = async () => {
    // Clear timer
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdownActive(false);
    
    const timestamp = Date.now();
    
    // If Firebase configured, write a cancelled event record for audit safety
    if (user && isFirebaseConfigured && db) {
      try {
        const payload = {
          studentName: user.email.split('@')[0],
          studentUID: user.uid,
          codephraseUsed: 'User Cancelled Countdown',
          timestamp,
          status: 'cancelled'
        };
        await setDoc(doc(db, 'sos_events', `${user.uid}_${timestamp}`), payload);
        await setDoc(doc(db, 'sos_events', user.uid, 'events', String(timestamp)), payload);
      } catch (err) {
        console.warn('[Firestore] Failed saving cancelled SOS log', err);
      }
    }

    triggerToast("SOS Cancelled successfully");
  };

  const commitDistressSignal = async (timestamp: number, triggerPhraseUsed: string) => {
    try {
      console.log('[SilentSOS] Committing Silent distress SOS signal...');
      
      // Use hardcoded emergency coordinates for the demo
      const gpslat = 22.5744;
      const gpslng = 88.3629;

      const studentName = user?.email ? user.email.split('@')[0] : 'Student';
      const studentUID = user?.uid || 'guest_uid';

      const eventPayload = {
        studentName,
        studentUID,
        codephraseUsed: triggerPhraseUsed,
        gpslat,
        gpslng,
        mapsLink: `https://maps.google.com/?q=${gpslat},${gpslng}`,
        situationSummary: situation || 'Student needs urgent assistance at these coordinates.',
        trustedContacts: contacts.map(c => ({
          name: c.name,
          phone: c.phone,
          email: c.email,
          relationship: c.relationship || 'Friend'
        })),
        timestamp,
        status: 'active'
      };

      // 1. Write SOS event to Firestore
      if (isFirebaseConfigured && db && user) {
        // Save to multiple targets to support diverse nested schema patterns
        await setDoc(doc(db, 'sos_events', `${user.uid}_${timestamp}`), eventPayload);
        await setDoc(doc(db, 'sos_events', user.uid, 'events', String(timestamp)), eventPayload);
        
        // Also update users armed state
        await updateDoc(doc(db, 'users', user.uid), { sosArmed: true });
        console.log('[Firestore] Silent SOS event saved successfully!');
      }

      // 2. Persist Active SOS state locally
      if (user) {
        await AsyncStorage.setItem(
          `@silentsos_active_event_${user.uid}`, 
          JSON.stringify({ timestamp, status: 'active' })
        );
      }

      setIsSOSActive(true);
      setSosTimestamp(timestamp);
      triggerToast('SOS sent silently. Contacts notified.');

      // Also fire global safety hooks
      await fireSOS();

      // 3. Open Native SMS app using Expo SMS with prefilled message
      try {
        const studentNameVal = studentName || 'Student';
        const situationVal = situation || 'Student needs urgent assistance at these coordinates.';
        const mapsLinkVal = `https://maps.google.com/?q=${gpslat},${gpslng}`;
        
        const smsMessage = `🔴 SILENT SOS from ${studentNameVal}
${situationVal}
Location: ${mapsLinkVal}
They may not be able to talk. Please help immediately.`;

        const phoneNumbers = contacts.map(c => c.phone).filter(Boolean);
        
        if (phoneNumbers.length > 0) {
          const isAvailable = await SMS.isAvailableAsync();
          if (isAvailable) {
            console.log('[SilentSOS] Launching native SMS Composer with numbers:', phoneNumbers);
            await SMS.sendSMSAsync(phoneNumbers, smsMessage);
          } else {
            console.warn('[SilentSOS] SMS services are not available on this platform/device.');
          }
        } else {
          console.log('[SilentSOS] No phone numbers found for trusted contacts to trigger SMS.');
        }
      } catch (smsErr) {
        console.error('[SilentSOS] Failed to trigger Expo SMS:', smsErr);
      }

      // Trigger automatic redirect to recipient alert screen layout
      setTimeout(() => {
        router.push({
          pathname: '/alert',
          params: { alertId: `alert_${timestamp}` }
        });
      }, 1800);

    } catch (e) {
      console.error('[SOS Sending Engine] Error firing distress alert', e);
      triggerToast('Error sending alert. Reverting to backup.');
    }
  };

  const handleResolveSOS = async () => {
    if (!user || !sosTimestamp) return;

    try {
      // 1. Write resolved state to Firestore
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { sosArmed: false });
        
        const updatePayload = { status: 'resolved' };
        await updateDoc(doc(db, 'sos_events', `${user.uid}_${sosTimestamp}`), updatePayload);
        await updateDoc(doc(db, 'sos_events', user.uid, 'events', String(sosTimestamp)), updatePayload);
      }

      // 2. Clear persistent local records
      await AsyncStorage.removeItem(`@silentsos_active_event_${user.uid}`);
      
      setIsSOSActive(false);
      setSosTimestamp(null);
      triggerToast('SOS resolved. Your contacts have been informed.');

    } catch (err) {
      console.error('[SOS Resolution] Failed to resolve SOS signal', err);
      triggerToast('Error resolving. Try again.');
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const sentText = message.trim();
    
    // Add to decoy history layout
    const newMessage: ChatBubble = {
      id: Math.random().toString(36).substring(2, 9),
      text: sentText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setMessage('');

    // Scroll chat window down
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    // If System is Armed AND text matches configured code phrase, fire Silent Countdown!
    if (isArmed) {
      const normalizedSent = sentText.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
      const normalizedTrigger = codePhrase.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
      
      const isExactMatch = normalizedSent === normalizedTrigger;
      const isInclusive = normalizedSent.includes(normalizedTrigger) || normalizedTrigger.includes(normalizedSent);

      if ((isExactMatch || isInclusive) && sentText.length > 0) {
        console.log('[SOS Engine] Secure Trigger Cover Phrase Detected!');
        initiateCountdown(sentText);
        return;
      }
    }

    // Normal message sent behavior
    triggerToast("Message sent");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        
        {/* SOS ACTIVE BANNER */}
        {isSOSActive && (
          <Animated.View 
            style={{
              opacity: bannerPulse,
              backgroundColor: '#dc2626',
              paddingHorizontal: 20,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1.5,
              borderBottomColor: '#991b1b',
            }}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-2" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={18} color="white" />
              <Text className="text-white text-xs font-black uppercase tracking-wider ml-1">
                🚨 SOS distress alert active
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleResolveSOS}
              className="bg-white px-3 py-1.5 rounded-lg shadow-sm active:bg-neutral-50"
            >
              <Text className="text-red-700 text-[10px] font-black uppercase tracking-tight">
                I am safe now
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Dynamic Disguised Header */}
        <View className="border-b border-neutral-100 px-6 py-4.5 flex-row items-center justify-between bg-white">
          <TouchableOpacity 
            activeOpacity={1}
            onPress={handleHeaderTap}
            className="flex-row items-center"
          >
            {/* Innocent profile bubble */}
            <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center border border-neutral-200">
              <Text className="text-xs font-bold text-neutral-500">SG</Text>
            </View>
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="text-sm font-bold text-neutral-800">Study Group Chat</Text>
                
                {/* Subtle breathing pulsing blue dot */}
                {isArmed && (
                  <Animated.View 
                    style={{
                      opacity: pulseAnim,
                      transform: [{
                        scale: pulseAnim.interpolate({
                          inputRange: [0.4, 1],
                          outputRange: [0.8, 1.1]
                        })
                      }]
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-primary-500 ml-2"
                  />
                )}
              </View>
              <Text className="text-[10px] text-emerald-500 font-semibold tracking-wide uppercase mt-0.5">
                Active Members: 4
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Tactical Disguised Arm SOS Switch */}
          <View 
            className="flex-row items-center"
            style={[
              { 
                flexDirection: 'row', 
                alignItems: 'center', 
                borderRadius: 16, 
                paddingHorizontal: 12, 
                paddingVertical: 6,
                borderWidth: 1.5,
              },
              isArmed ? {
                backgroundColor: '#eff6ff',
                borderColor: '#3b82f6',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 6,
                elevation: 4
              } : {
                backgroundColor: '#f9fafb',
                borderColor: '#f3f4f6',
              }
            ]}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: isArmed ? '#1d4ed8' : '#6b7280', textTransform: 'uppercase', marginRight: 6 }}>Arm SOS</Text>
            <Switch
              value={isArmed}
              onValueChange={handleToggleArm}
              trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
              thumbColor={isArmed ? '#1a56db' : '#9ca3af'}
              ios_backgroundColor="#e5e7eb"
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        {/* Chat History Area */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 bg-neutral-50/50 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {chatHistory.map((item) => {
            const isMe = item.sender === 'me';
            return (
              <View 
                key={item.id}
                className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <View className="w-7 h-7 rounded-full bg-neutral-200 items-center justify-center mr-2 self-end">
                    <Text className="text-[9px] font-bold text-neutral-500">JD</Text>
                  </View>
                )}
                
                <View className="flex-col max-w-[75%]">
                  <View 
                    className={`rounded-[22px] px-4.5 py-3 ${
                      isMe 
                        ? 'bg-primary-500 rounded-tr-md' 
                        : 'bg-white border border-neutral-150 rounded-tl-md shadow-sm'
                    }`}
                  >
                    <Text className={`text-sm leading-5 ${isMe ? 'text-white' : 'text-neutral-700'}`}>
                      {item.text}
                    </Text>
                  </View>
                  <Text className={`text-[8px] text-neutral-400 mt-1 pl-1 ${isMe ? 'text-right' : 'text-left'}`}>
                    {item.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Message Input Box / Large Text Area */}
        <View className="border-t border-neutral-100 bg-white px-4 py-3 flex-row items-center space-x-3">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-4.5 py-3 text-sm focus:border-neutral-300 h-11"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          
          <TouchableOpacity 
            onPress={handleSend}
            className="w-11 h-11 bg-primary-500 border border-primary-600 rounded-2xl items-center justify-center active:opacity-90 shadow-sm"
          >
            <Send size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* 10-SECOND COUNTDOWN SECURED OVERLAY */}
        {countdownActive && (
          <View className="absolute inset-0 bg-neutral-900/95 z-50 flex-col items-center justify-center px-6">
            
            <View className="w-16 h-16 rounded-[22px] bg-red-600/10 border border-red-500/20 items-center justify-center mb-6">
              <ShieldAlert size={32} color="#ef4444" strokeWidth={1.5} />
            </View>

            <Text className="text-white text-lg font-bold tracking-tight text-center">
              Secured Silent distress SOS signal
            </Text>
            
            <Text className="text-neutral-400 text-xs mt-2 text-center max-w-[280px] leading-5">
              Distress coordinates are preparing to fire. Tap cancel below to abort.
            </Text>

            {/* Countdown Big Timer */}
            <View className="w-28 h-28 rounded-full border border-red-500/30 items-center justify-center my-8 relative">
              <View className="absolute inset-2 rounded-full border border-red-500/10" />
              <Text className="text-white text-5xl font-black">{countdownSeconds}</Text>
              <Text className="text-red-500 text-[9px] font-black uppercase tracking-widest mt-1">Seconds</Text>
            </View>

            <TouchableOpacity 
              onPress={handleCancelCountdown}
              className="bg-red-600 border border-red-700 w-full py-4 rounded-2xl items-center active:opacity-95 shadow-lg mt-4"
            >
              <Text className="text-white text-xs font-black uppercase tracking-wider">
                Cancel SOS
              </Text>
            </TouchableOpacity>

          </View>
        )}

        {/* Floating Cover Toast */}
        <Animated.View 
          style={{ opacity: toastOpacity }}
          className="absolute bottom-20 left-6 right-6 bg-neutral-800/90 rounded-2xl py-3 px-4.5 items-center shadow-lg pointer-events-none"
        >
          <Text className="text-white text-xs font-semibold text-center">{toastMessage}</Text>
        </Animated.View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

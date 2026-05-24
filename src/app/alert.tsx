import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Linking, Platform, Clipboard, Animated, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone, ShieldAlert, Navigation, CheckCircle2, Copy, AlertOctagon } from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';

export default function AlertScreen() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams();
  const { activeAlert, alertHistory, dismissActiveAlert, user, situation } = useApp();

  // Toast animation state
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  // Subtle pulsing animation for distress alert banner
  const pulseAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.9, duration: 1200, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  // Safe fallback mock distress event for demo mode / layout validation
  const demoAlert = {
    id: 'demo_alert',
    timestamp: Date.now() - 120000, // 2 minutes ago
    location: {
      latitude: 22.5744,
      longitude: 88.3629,
      address: "Simulated University Campus, Hostel B Room 214"
    },
    situation: situation || "I may be in danger at Hostel B Room 214. Please contact the warden or call campus security.",
    triggerPhrase: "Did you finish the assignment?",
    senderEmail: user?.email || "arman@rcciit.org.in"
  };

  const alertItem = alertId
    ? (alertHistory.find(h => h.id === alertId) || demoAlert)
    : (activeAlert || demoAlert);

  const studentName = alertItem.senderEmail ? alertItem.senderEmail.split('@')[0] : 'Student';

  // Live timer tick for time elapsed since the SOS was triggered
  const [timeElapsed, setTimeElapsed] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const diffMs = Date.now() - alertItem.timestamp;
      const diffSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(diffSecs / 60);
      const secs = diffSecs % 60;
      
      if (mins > 0) {
        setTimeElapsed(`${mins}m ${secs}s ago`);
      } else {
        setTimeElapsed(`${secs}s ago`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [alertItem.timestamp]);

  const handleCallStudent = () => {
    Linking.openURL('tel:5550192834'); // Pre-set mock student phone number
  };

  const handleCallCampusSecurity = () => {
    Linking.openURL('tel:911'); // Campus security dispatcher emergency number
  };

  const handleShareLocation = () => {
    Clipboard.setString('https://maps.google.com/?q=22.5744,88.3629');
    triggerToast('Maps link copied to clipboard!');
  };

  const handleResolveAlert = async () => {
    try {
      if (user && isFirebaseConfigured && db) {
        // Clear active SOS triggers on Firebase
        await updateDoc(doc(db, 'users', user.uid), { sosArmed: false });
        
        if (alertItem.id !== 'demo_alert') {
          const updatePayload = { status: 'resolved' };
          await updateDoc(doc(db, 'sos_events', `${user.uid}_${alertItem.timestamp}`), updatePayload);
          await updateDoc(doc(db, 'sos_events', user.uid, 'events', String(alertItem.timestamp)), updatePayload);
        }
      }
      
      dismissActiveAlert();
      triggerToast('Crisis marked as RESOLVED.');
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (err) {
      console.error('[Distress Resolution Error]', err);
      // Fallback local cleanup
      dismissActiveAlert();
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toast Alert overlay */}
      <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Giant Red Banner Alert Header */}
        <Animated.View style={[styles.alertBanner, { opacity: pulseAnim }]}>
          <View style={styles.alertIconBg}>
            <ShieldAlert size={36} color="#ffffff" />
          </View>
          <Text style={styles.alertBannerText}>🔴 SILENT SOS ACTIVE</Text>
          <Text style={styles.timeTicker}>Distress signaled: {timeElapsed}</Text>
        </Animated.View>

        {/* Panic Info Card */}
        <View style={styles.whiteCard}>
          <Text style={styles.sectionHeader}>STUDENT IN DISTRESS</Text>
          <Text style={styles.studentNameText}>{studentName}</Text>
          <Text style={styles.studentEmailText}>{alertItem.senderEmail}</Text>
        </View>

        {/* Situation Description Card */}
        <View style={styles.whiteCard}>
          <View style={styles.headerRow}>
            <AlertOctagon size={20} color="#dc2626" />
            <Text style={styles.sectionHeaderWithIcon}>SITUATION SUMMARY</Text>
          </View>
          <View style={styles.situationContainer}>
            <Text style={styles.situationText}>
              "{alertItem.situation}"
            </Text>
          </View>
        </View>

        {/* Premium Map Location Card */}
        <View style={styles.whiteCard}>
          <Text style={styles.sectionHeader}>LAST GEOGRAPHIC LOCATION</Text>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => Linking.openURL('https://maps.google.com/?q=22.5744,88.3629')}
            style={styles.mapPlaceholder}
          >
            <View style={styles.radarRingOuter}>
              <View style={styles.radarRingInner}>
                <View style={styles.radarCore} />
              </View>
            </View>
            <Text style={styles.mapLabel}>GPS TARGET: 22.5744, 88.3629</Text>
            <Text style={styles.mapSubLabel}>Tap to view in live Google Maps</Text>
          </TouchableOpacity>

          <Text style={styles.addressText}>
            📍 {alertItem.location.address}
          </Text>
        </View>

        {/* Big Actions Triage Buttons Stack */}
        <View style={styles.buttonStack}>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]} 
            onPress={handleCallStudent}
          >
            <Phone size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Call Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.securityButton]} 
            onPress={handleCallCampusSecurity}
          >
            <ShieldAlert size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Contact Campus Security</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={handleShareLocation}
          >
            <Navigation size={24} color="#dc2626" />
            <Text style={styles.shareButtonText}>Share Location</Text>
          </TouchableOpacity>

        </View>

        {/* Resolution Safety Button */}
        <TouchableOpacity 
          style={styles.safeButton} 
          onPress={handleResolveAlert}
        >
          <CheckCircle2 size={24} color="#ffffff" />
          <Text style={styles.safeButtonText}>Student is Safe ✅</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fcfcfc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  alertBanner: {
    backgroundColor: '#dc2626',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  alertIconBg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  alertBannerText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  timeTicker: {
    color: '#fee2e2',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  whiteCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionHeaderWithIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 1.5,
  },
  studentNameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  studentEmailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 2,
  },
  situationContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  situationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#991b1b',
    lineHeight: 26,
  },
  mapPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    marginVertical: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fca5a5',
  },
  radarRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  mapLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
    marginTop: 12,
  },
  mapSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
    marginTop: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    lineHeight: 18,
  },
  buttonStack: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#2563eb',
  },
  securityButton: {
    backgroundColor: '#dc2626',
  },
  shareButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  shareButtonText: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '800',
  },
  safeButton: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  safeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
});

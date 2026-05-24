import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Switch, TouchableOpacity, Alert, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, ShieldAlert, Users, MessageSquare, AlertTriangle, ArrowRight, CheckCircle2, History } from 'lucide-react-native';
import { Card } from '../../components/Card';
import { useApp } from '../../context/AppContext';

export default function HomeDashboard() {
  const router = useRouter();
  const { 
    isArmed, 
    toggleArmed, 
    contacts, 
    codePhrase, 
    situation, 
    alertHistory,
    user,
    logout
  } = useApp();

  const [loading, setLoading] = useState(true);

  // Simulate loading state on initial mount to display gorgeous skeletons/spinners
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleLogoutPress = () => {
    const performLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (e) {
        console.error('Logout error', e);
      }
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of SilentSOS?');
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to log out of SilentSOS?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Out', 
            style: 'destructive', 
            onPress: performLogout
          }
        ]
      );
    }
  };

  const isCodephraseComplete = !!(codePhrase && codePhrase.trim());
  const isContactsComplete = !!(contacts && contacts.length > 0);
  const isSituationComplete = !!(situation && situation.trim());
  const isSetupFullyComplete = isCodephraseComplete && isContactsComplete && isSituationComplete;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a56db" />
          <Text style={styles.loadingText}>Syncing Secure Safety Link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Branding */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>Secure Safety Link</Text>
            <Text style={styles.headerTitle}>
              Silent<Text style={styles.textAccent}>SOS</Text>
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleLogoutPress}
            style={styles.profileBtn}
          >
            <Text style={styles.profileBtnText}>
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'ST'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Setup Completion Summary Indicator */}
        {!isSetupFullyComplete ? (
          <View style={styles.warningCard}>
            <View style={styles.warningHeaderRow}>
              <AlertTriangle size={24} color="#d97706" />
              <Text style={styles.warningTitle}>Your SOS is not fully set up</Text>
            </View>
            <Text style={styles.warningSubText}>
              Configure your secret cover phrase, alert message, and trusted contacts so they can help you during distress.
            </Text>
            
            <View style={styles.stepsIndicatorRow}>
              <View style={styles.stepIndicator}>
                <Text style={isCodephraseComplete ? styles.stepCompleteText : styles.stepIncompleteText}>
                  {isCodephraseComplete ? '✓ Cover Phrase' : '○ Cover Phrase'}
                </Text>
              </View>
              <View style={styles.stepIndicator}>
                <Text style={isContactsComplete ? styles.stepCompleteText : styles.stepIncompleteText}>
                  {isContactsComplete ? '✓ Contacts' : '○ Contacts'}
                </Text>
              </View>
              <View style={styles.stepIndicator}>
                <Text style={isSituationComplete ? styles.stepCompleteText : styles.stepIncompleteText}>
                  {isSituationComplete ? '✓ Situation' : '○ Situation'}
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.warningActionBtn}
              onPress={() => router.push('/setup')}
            >
              <Text style={styles.warningActionBtnText}>Complete Setup Now</Text>
              <ArrowRight size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.successCard}>
            <View style={styles.warningHeaderRow}>
              <CheckCircle2 size={24} color="#16a34a" />
              <Text style={styles.successTitle}>SOS Protection Fully Active</Text>
            </View>
            
            <View style={styles.stepsIndicatorRow}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepCompleteText}>✓ Cover Phrase</Text>
              </View>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepCompleteText}>✓ Contacts</Text>
              </View>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepCompleteText}>✓ Situation</Text>
              </View>
            </View>
          </View>
        )}

        {/* System Arming Status Card */}
        <Card className="mb-6 relative overflow-hidden">
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 96,
            height: 96,
            borderRadius: 48,
            opacity: 0.2,
            backgroundColor: isArmed ? '#34d399' : '#9ca3af',
          }} />
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-3.5">
              <View 
                className={`w-12 h-12 rounded-2xl items-center justify-center ${
                  isArmed ? 'bg-emerald-50 border border-emerald-100' : 'bg-neutral-100 border border-neutral-200'
                }`}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                {isArmed ? (
                  <CheckCircle2 size={24} color="#10b981" strokeWidth={2} />
                ) : (
                  <AlertTriangle size={24} color="#9ca3af" strokeWidth={2} />
                )}
              </View>
              
              <View className="ml-3">
                <Text className="text-lg font-bold text-neutral-800">
                  {isArmed ? 'System Armed' : 'System Disarmed'}
                </Text>
                <Text className="text-xs text-neutral-400 font-medium">
                  {isArmed ? 'Monitoring for trigger words' : 'Trigger words are inactive'}
                </Text>
              </View>
            </View>

            <Switch
              value={isArmed}
              onValueChange={toggleArmed}
              trackColor={{ false: '#d1d5db', true: '#a7f3d0' }}
              thumbColor={isArmed ? '#10b981' : '#9ca3af'}
              ios_backgroundColor="#e5e7eb"
            />
          </View>
        </Card>

        {/* Spectacular Quick-Arm Button on Dashboard */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={toggleArmed}
          style={[
            styles.quickArmButton,
            isArmed ? styles.quickArmButtonArmed : styles.quickArmButtonDisarmed
          ]}
        >
          <Shield size={22} color="#ffffff" />
          <Text style={styles.quickArmButtonText}>
            {isArmed ? 'QUICK DISARM ALARM' : 'TAP TO QUICK-ARM SYSTEM'}
          </Text>
        </TouchableOpacity>

        {/* Quick Config Widgets Row */}
        <View style={styles.widgetRow}>
          
          {/* Contacts Count Widget with names preview */}
          <TouchableOpacity 
            onPress={() => router.push('/setup')}
            style={styles.widgetCard}
          >
            <View style={[styles.widgetIconBg, styles.widgetBlueIcon]}>
              <Users size={20} color="#1a56db" />
            </View>
            <Text style={styles.widgetNumber}>{contacts.length}</Text>
            <Text style={styles.widgetLabel}>Contacts</Text>
            <Text style={styles.previewNamesText} numberOfLines={1}>
              {contacts.length > 0 
                ? contacts.map(c => c.name).join(', ') 
                : 'None Configured'}
            </Text>
          </TouchableOpacity>

          {/* Trigger Alert Status Widget */}
          <TouchableOpacity 
            onPress={() => router.push('/send')}
            style={styles.widgetCard}
          >
            <View style={[styles.widgetIconBg, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' }]}>
              <Shield size={20} color="#dc2626" />
            </View>
            <Text style={styles.widgetNumber}>{isArmed ? 'Active' : 'Offline'}</Text>
            <Text style={styles.widgetLabel}>SEND SOS</Text>
            <Text style={styles.previewNamesText} numberOfLines={1}>
              {isArmed ? 'Dot Pulsing Enabled' : 'Normal Composer'}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Live Distress Feed Demo Shortcut */}
        <TouchableOpacity 
          onPress={() => router.push('/alert')}
          className="mb-6 bg-red-50 border-2 border-red-100 rounded-3xl p-5 shadow-sm active:opacity-95 flex-row items-center justify-between"
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <View className="flex-row items-center space-x-4 flex-1" style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View className="w-12 h-12 rounded-2xl bg-red-500 items-center justify-center">
              <ShieldAlert size={24} color="white" />
            </View>
            
            <View className="ml-3 flex-1" style={{ marginLeft: 12, flex: 1 }}>
              <Text className="text-red-800 font-extrabold text-base">
                🚨 Live Alert Console Demo
              </Text>
              <Text className="text-red-600 text-xs font-semibold mt-0.5 leading-4">
                Simulate the real-time distress screen trusted contacts see when your SilentSOS triggers.
              </Text>
            </View>
          </View>
          
          <ArrowRight size={18} color="#ef4444" style={{ marginLeft: 12 }} />
        </TouchableOpacity>

        {/* Code Phrase Innocent Display Card */}
        <Card 
          title="Active Cover Text" 
          subtitle="Your normal safe-word study trigger" 
          className="mb-6"
          headerRight={
            <TouchableOpacity onPress={() => router.push('/setup')}>
              <Text className="text-xs font-bold text-primary-500">Edit</Text>
            </TouchableOpacity>
          }
        >
          <View className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
            <Text className="text-sm font-semibold text-neutral-600 italic">
              {codePhrase ? `"${codePhrase}"` : '"None Configured yet"'}
            </Text>
          </View>
        </Card>

        {/* Real-time Emergency Payload Card */}
        <Card 
          title="Custom Emergency Payload" 
          subtitle="Sent secretly with GPS coordinates" 
          className="mb-6"
          headerRight={
            <TouchableOpacity onPress={() => router.push('/setup')}>
              <Text className="text-xs font-bold text-primary-500">Configure</Text>
            </TouchableOpacity>
          }
        >
          <Text className="text-sm font-medium text-neutral-500 leading-6 pl-1">
            {situation ? (situation.length > 90 ? `${situation.substring(0, 90)}...` : situation) : 'None Configured yet'}
          </Text>
        </Card>

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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  textAccent: {
    color: '#2563eb',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4b5563',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  warningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#b45309',
  },
  warningSubText: {
    fontSize: 13,
    color: '#d97706',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  stepsIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  stepIndicator: {
    flex: 1,
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCompleteText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  stepIncompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    opacity: 0.6,
  },
  warningActionBtn: {
    backgroundColor: '#d97706',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  warningActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803d',
  },
  quickArmButton: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  quickArmButtonArmed: {
    backgroundColor: '#10b981',
  },
  quickArmButtonDisarmed: {
    backgroundColor: '#9ca3af',
  },
  quickArmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  widgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  widgetIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  widgetBlueIcon: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  widgetIndigoIcon: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  widgetNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  widgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  previewNamesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 6,
  },
});

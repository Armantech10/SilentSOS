import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useApp } from '../../context/AppContext';
import { collection, query, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../services/firebase';
import { ShieldAlert, CheckCircle2, Clock, XCircle, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface SOSEvent {
  id: string;
  studentName: string;
  studentUID: string;
  codephraseUsed: string;
  gpslat: number;
  gpslng: number;
  mapsLink: string;
  situationSummary: string;
  timestamp: number;
  status: 'active' | 'resolved' | 'cancelled';
}

export default function SOSHistoryScreen() {
  const router = useRouter();
  const { user } = useApp();
  
  const [events, setEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animated pulse for loading skeleton
  const pulseAnim = new Animated.Value(0.3);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true })
        ])
      ).start();
    }
  }, [loading]);

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isFirebaseConfigured && db) {
        console.log('[History] Querying Firestore for user: ', user.uid);
        
        // Attempt to fetch from nested subcollection first
        const subcollRef = collection(db, 'sos_events', user.uid, 'events');
        const qSub = query(subcollRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(qSub);
        
        const fetchedEvents: SOSEvent[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedEvents.push({
            id: docSnap.id,
            ...docSnap.data()
          } as SOSEvent);
        });

        // If nested is empty, try root collection query
        if (fetchedEvents.length === 0) {
          const rootCollRef = collection(db, 'sos_events');
          const rootSnapshot = await getDocs(rootCollRef);
          rootSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.studentUID === user.uid) {
              fetchedEvents.push({
                id: docSnap.id,
                ...data
              } as SOSEvent);
            }
          });
          // Sort descending manually since root query might not be filtered
          fetchedEvents.sort((a, b) => b.timestamp - a.timestamp);
        }

        setEvents(fetchedEvents);
      } else {
        // Fallback demo events for offline testing
        setEvents([
          {
            id: 'mock_1',
            studentName: user.email.split('@')[0],
            studentUID: user.uid,
            codephraseUsed: 'Did you finish the assignment?',
            gpslat: 22.5744,
            gpslng: 88.3629,
            mapsLink: 'https://maps.google.com/?q=22.5744,88.3629',
            situationSummary: 'Hostel B Room 214. Need help.',
            timestamp: Date.now() - 3600000 * 2, // 2 hours ago
            status: 'resolved'
          },
          {
            id: 'mock_2',
            studentName: user.email.split('@')[0],
            studentUID: user.uid,
            codephraseUsed: 'User Cancelled Countdown',
            gpslat: 22.5744,
            gpslng: 88.3629,
            mapsLink: 'https://maps.google.com/?q=22.5744,88.3629',
            situationSummary: 'Hostel B Room 214. Need help.',
            timestamp: Date.now() - 3600000 * 24, // 1 day ago
            status: 'cancelled'
          }
        ]);
      }
    } catch (e) {
      console.error('[History] Failed to retrieve Firestore logs', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status: SOSEvent['status']) => {
    switch (status) {
      case 'active':
        return (
          <View style={[styles.badge, styles.badgeActive]}>
            <ShieldAlert size={12} color="#dc2626" />
            <Text style={[styles.badgeText, styles.textActive]}>ACTIVE</Text>
          </View>
        );
      case 'resolved':
        return (
          <View style={[styles.badge, styles.badgeResolved]}>
            <CheckCircle2 size={12} color="#16a34a" />
            <Text style={[styles.badgeText, styles.textResolved]}>RESOLVED</Text>
          </View>
        );
      case 'cancelled':
        return (
          <View style={[styles.badge, styles.badgeCancelled]}>
            <XCircle size={12} color="#6b7280" />
            <Text style={[styles.badgeText, styles.textCancelled]}>CANCELLED</Text>
          </View>
        );
    }
  };

  // Render Skeleton cards while loading
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SOS Distress Log</Text>
          <Text style={styles.headerSubtitle}>Real-time Firestore history feed</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {[1, 2, 3].map((key) => (
            <Animated.View key={key} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonBadge} />
                <View style={styles.skeletonDate} />
              </View>
              <View style={styles.skeletonLineShort} />
              <View style={styles.skeletonLineLong} />
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOS Distress Log</Text>
        <Text style={styles.headerSubtitle}>Real-time Firestore history feed</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1a56db']} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShieldCheck size={56} color="#3b82f6" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No SOS events. Stay safe. 💙</Text>
            <Text style={styles.emptySubText}>
              Any distress alerts or cancel loops you trigger will show up here.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Text style={styles.refreshBtnText}>Refresh History</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.cardHeader}>
                  {getStatusBadge(event.status)}
                  <View style={styles.timeContainer}>
                    <Clock size={12} color="#9ca3af" />
                    <Text style={styles.timeText}>{formatDateTime(event.timestamp)}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.infoLabel}>Code Phrase Triggered:</Text>
                  <Text style={styles.phraseText}>"{event.codephraseUsed}"</Text>

                  {event.situationSummary ? (
                    <>
                      <Text style={styles.infoLabel}>Situation Summary:</Text>
                      <Text style={styles.situationText}>{event.situationSummary}</Text>
                    </>
                  ) : null}
                </View>

                <View style={styles.cardDivider} />

                <TouchableOpacity 
                  style={styles.detailsBtn}
                  onPress={() => router.push({ pathname: '/alert', params: { alertId: event.id } })}
                >
                  <Text style={styles.detailsBtnText}>View Full Alert Console</Text>
                  <ArrowRight size={14} color="#1a56db" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcfcfc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonBadge: {
    width: 80,
    height: 22,
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  skeletonDate: {
    width: 120,
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  skeletonLineShort: {
    width: '50%',
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  skeletonLineLong: {
    width: '100%',
    height: 14,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  refreshBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  refreshBtnText: {
    color: '#1a56db',
    fontSize: 14,
    fontWeight: '800',
  },
  listContainer: {
    gap: 16,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  badgeResolved: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgeCancelled: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textActive: {
    color: '#dc2626',
  },
  textResolved: {
    color: '#16a34a',
  },
  textCancelled: {
    color: '#4b5563',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  cardBody: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  phraseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    fontStyle: 'italic',
  },
  situationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: -20,
    marginBottom: 14,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a56db',
  },
});

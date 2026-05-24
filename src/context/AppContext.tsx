import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  mockAuth, 
  User as MockUser 
} from '../services/firebase';
import { getCurrentLocation, LocationData } from '../services/location';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc 
} from 'firebase/firestore';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship?: string;
  notified: boolean;
}

export interface SOSAlert {
  id: string;
  timestamp: number;
  location: LocationData;
  situation: string;
  triggerPhrase: string;
  contactsNotified: Omit<Contact, 'notified'>[];
  senderEmail: string;
}

interface AppContextType {
  user: { uid: string; email: string } | null;
  loading: boolean;
  isArmed: boolean;
  codePhrase: string;
  contacts: Contact[];
  situation: string;
  activeAlert: SOSAlert | null;
  alertHistory: SOSAlert[];
  toggleArmed: () => Promise<void>;
  updateCodePhrase: (phrase: string) => Promise<void>;
  addContact: (name: string, phone: string, email: string, relationship?: string) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  updateSituation: (text: string) => Promise<void>;
  fireSOS: () => Promise<SOSAlert>;
  dismissActiveAlert: () => void;
  clearHistory: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // App States
  const [isArmed, setIsArmed] = useState(false);
  const [codePhrase, setCodePhrase] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [situation, setSituation] = useState('');
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [alertHistory, setAlertHistory] = useState<SOSAlert[]>([]);

  // Log Firebase Config status on context mount to check .env values
  useEffect(() => {
    console.log('[SilentSOS] Firebase Environment Variables Check:');
    console.log(' - EXPO_PUBLIC_FIREBASE_API_KEY:', process.env.EXPO_PUBLIC_FIREBASE_API_KEY ? 'PRESENT (Length: ' + process.env.EXPO_PUBLIC_FIREBASE_API_KEY.length + ')' : 'ABSENT');
    console.log(' - EXPO_PUBLIC_FIREBASE_PROJECT_ID:', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ABSENT');
    console.log(' - isFirebaseConfigured flag resolved as:', isFirebaseConfigured);
  }, []);

  // 1. Session Persistence & Realtime Firestore sync setup
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;

    const handleAuthChange = async (authUser: any) => {
      console.log('[SilentSOS] Auth State Changed Callback! Loaded User Details:', authUser ? { uid: authUser.uid, email: authUser.email } : 'Null / Guest');
      
      if (authUser) {
        // Authenticated!
        setUser({ uid: authUser.uid, email: authUser.email || '' });
        
        // Sync setting states from Firestore in real-time
        if (isFirebaseConfigured && db) {
          try {
            const userDocRef = doc(db, 'users', authUser.uid);
            unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                setIsArmed(!!data.sosArmed);
                setCodePhrase(data.codephrase || '');
                setContacts(data.trustedContacts || []);
                setSituation(data.situationSummary || '');
              }
            }, (error) => {
              console.warn('[Firestore] Error in real-time sync listener:', error);
            });
          } catch (e) {
            console.error('[Firestore] Error establishing listener:', e);
          }
        } else {
          // Firebase offline fallback: Load from local AsyncStorage
          await loadOfflineState(authUser.uid);
        }
      } else {
        // Logged out
        setUser(null);
        setIsArmed(false);
        setCodePhrase('');
        setContacts([]);
        setSituation('');
        setActiveAlert(null);
        if (unsubscribeFirestore) unsubscribeFirestore();
      }
      setLoading(false);
    };

    let unsubscribeAuth: () => void;

    if (isFirebaseConfigured && auth) {
      unsubscribeAuth = firebaseOnAuthStateChanged(auth, handleAuthChange);
    } else {
      unsubscribeAuth = mockAuth.onAuthStateChanged(handleAuthChange);
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Offline Helper to retrieve data from AsyncStorage
  const loadOfflineState = async (uid: string) => {
    try {
      const savedArmed = await AsyncStorage.getItem(`@silentsos_armed_${uid}`);
      if (savedArmed !== null) setIsArmed(JSON.parse(savedArmed));

      const savedPhrase = await AsyncStorage.getItem(`@silentsos_codephrase_${uid}`);
      if (savedPhrase) setCodePhrase(savedPhrase);

      const savedContacts = await AsyncStorage.getItem(`@silentsos_contacts_${uid}`);
      if (savedContacts) setContacts(JSON.parse(savedContacts));

      const savedSituation = await AsyncStorage.getItem(`@silentsos_situation_${uid}`);
      if (savedSituation) setSituation(savedSituation);

      const savedHistory = await AsyncStorage.getItem(`@silentsos_history_${uid}`);
      if (savedHistory) setAlertHistory(JSON.parse(savedHistory));

      const savedActiveAlert = await AsyncStorage.getItem(`@silentsos_active_alert_${uid}`);
      if (savedActiveAlert) setActiveAlert(JSON.parse(savedActiveAlert));
    } catch (e) {
      console.error('[Offline] Error loading local storage safety states:', e);
    }
  };

  // 2. Authentication Actions (Sign Up, Login, Log Out)
  const login = async (email: string, password = 'password123') => {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser({ uid: cred.user.uid, email: cred.user.email || '' });
    } else {
      await mockAuth.signInWithEmail(email);
    }
  };

  const signup = async (email: string, password = 'password123') => {
    if (isFirebaseConfigured && auth && db) {
      // 1. Create firebase user credentials
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2. Initialize Firestore User Document
      await setDoc(doc(db, 'users', uid), {
        name: email.split('@')[0],
        email: email,
        collegeEmail: email,
        createdAt: new Date().toISOString(),
        codephrase: "",
        situationSummary: "",
        trustedContacts: [],
        sosArmed: false
      });

      setUser({ uid, email });
    } else {
      // Offline fallback signup
      const mockUser = await mockAuth.signUpWithEmail(email);
      // Initialize offline AsyncStorage
      const uid = mockUser.uid;
      await AsyncStorage.setItem(`@silentsos_armed_${uid}`, JSON.stringify(false));
      await AsyncStorage.setItem(`@silentsos_codephrase_${uid}`, "");
      await AsyncStorage.setItem(`@silentsos_contacts_${uid}`, JSON.stringify([]));
      await AsyncStorage.setItem(`@silentsos_situation_${uid}`, "");
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await firebaseSignOut(auth);
    } else {
      await mockAuth.signOut();
    }
    setUser(null);
  };

  // 3. System States Modifiers (Updates both Firestore and Local Fallback)
  const toggleArmed = async () => {
    const nextVal = !isArmed;
    setIsArmed(nextVal);
    
    if (user) {
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { sosArmed: nextVal });
      } else {
        await AsyncStorage.setItem(`@silentsos_armed_${user.uid}`, JSON.stringify(nextVal));
      }
    }
  };

  const updateCodePhrase = async (phrase: string) => {
    setCodePhrase(phrase);
    
    if (user) {
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { codephrase: phrase });
      } else {
        await AsyncStorage.setItem(`@silentsos_codephrase_${user.uid}`, phrase);
      }
    }
  };

  const addContact = async (name: string, phone: string, email: string, relationship?: string) => {
    const newContact: Contact = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      phone,
      email,
      relationship,
      notified: false,
    };
    const updated = [...contacts, newContact];
    setContacts(updated);

    if (user) {
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { trustedContacts: updated });
      } else {
        await AsyncStorage.setItem(`@silentsos_contacts_${user.uid}`, JSON.stringify(updated));
      }
    }
  };

  const removeContact = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);

    if (user) {
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { trustedContacts: updated });
      } else {
        await AsyncStorage.setItem(`@silentsos_contacts_${user.uid}`, JSON.stringify(updated));
      }
    }
  };

  const updateSituation = async (text: string) => {
    setSituation(text);

    if (user) {
      if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'users', user.uid), { situationSummary: text });
      } else {
        await AsyncStorage.setItem(`@silentsos_situation_${user.uid}`, text);
      }
    }
  };

  // 4. Trigger SOS Emergency Action
  const fireSOS = async (): Promise<SOSAlert> => {
    console.log('[SOS] Real-time Silent Distress Alarm Firing...');
    const location = await getCurrentLocation();

    const alert: SOSAlert = {
      id: 'alert_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      location,
      situation: situation || 'Student needs urgent assistance at these coordinates.',
      triggerPhrase: codePhrase || 'Manual Trigger',
      contactsNotified: contacts.map(({ id, name, phone, email }) => ({ id, name, phone, email })),
      senderEmail: user?.email || 'anonymous-student@university.edu',
    };

    setActiveAlert(alert);
    const newHistory = [alert, ...alertHistory];
    setAlertHistory(newHistory);

    if (user) {
      // 1. Local Fallback persistence
      await AsyncStorage.setItem(`@silentsos_active_alert_${user.uid}`, JSON.stringify(alert));
      await AsyncStorage.setItem(`@silentsos_history_${user.uid}`, JSON.stringify(newHistory));

      // 2. Real Firestore Persistence
      if (isFirebaseConfigured && db) {
        try {
          // Save to a global /alerts tracking collection
          await addDoc(collection(db, 'alerts'), alert);
          
          // Also save in a subcollection under the user for safety
          await addDoc(collection(db, 'users', user.uid, 'alerts'), alert);
          console.log('[Firestore] Silent SOS saved to remote database!');
        } catch (e) {
          console.warn('[Firestore] Error saving SOS alert to database, using local backup:', e);
        }
      }
    }

    return alert;
  };

  const dismissActiveAlert = async () => {
    setActiveAlert(null);
    if (user) {
      await AsyncStorage.removeItem(`@silentsos_active_alert_${user.uid}`);
    }
  };

  const clearHistory = async () => {
    setAlertHistory([]);
    if (user) {
      await AsyncStorage.removeItem(`@silentsos_history_${user.uid}`);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      isArmed,
      codePhrase,
      contacts,
      situation,
      activeAlert,
      alertHistory,
      toggleArmed,
      updateCodePhrase,
      addContact,
      removeContact,
      updateSituation,
      fireSOS,
      dismissActiveAlert,
      clearHistory,
      login,
      signup,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

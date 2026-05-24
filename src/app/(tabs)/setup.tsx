import React, { useState, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Users, Plus, Trash2, Shield, MessageSquare, Clipboard, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';

export default function SetupScreen() {
  const { 
    codePhrase, 
    updateCodePhrase, 
    contacts, 
    addContact, 
    removeContact, 
    situation, 
    updateSituation 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'phrase' | 'contacts' | 'situation'>('phrase');

  const [newPhrase, setNewPhrase] = useState(codePhrase);
  const [newSituation, setNewSituation] = useState(situation);

  React.useEffect(() => {
    setNewPhrase(codePhrase);
  }, [codePhrase]);

  React.useEffect(() => {
    setNewSituation(situation);
  }, [situation]);
  
  // Custom Toast Animations
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true })
    ]).start();
  };

  // ==========================================
  // TAB 1: Code Phrase Setup
  // ==========================================
  const [phraseError, setPhraseError] = useState('');

  const handleSavePhrase = async () => {
    if (!newPhrase.trim()) {
      setPhraseError('Code phrase cannot be empty.');
      return;
    }
    if (newPhrase.length > 80) {
      setPhraseError('Code phrase cannot exceed 80 characters.');
      return;
    }
    setPhraseError('');
    await updateCodePhrase(newPhrase.trim());
    showToast('Code phrase saved successfully!');
  };

  // ==========================================
  // TAB 2: Trusted Contacts Setup
  // ==========================================
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [relationship, setRelationship] = useState<'Friend' | 'Parent' | 'RA' | 'Warden'>('Friend');
  const [contactError, setContactError] = useState('');

  const handleAddContact = async () => {
    setContactError('');

    if (contacts.length >= 3) {
      setContactError('Maximum of 3 trusted contacts reached. Remove one first.');
      return;
    }

    if (!contactName.trim() || !contactPhone.trim() || !contactEmail.trim()) {
      setContactError('Please fill in all contact details.');
      return;
    }

    // Phone format verification
    const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
    if (!phoneRegex.test(contactPhone.trim())) {
      setContactError('Invalid phone number format. Use numbers only.');
      return;
    }

    // Email format verification
    if (!contactEmail.trim().includes('@')) {
      setContactError('Please enter a valid email address.');
      return;
    }

    await addContact(contactName.trim(), contactPhone.trim(), contactEmail.trim(), relationship);
    
    // Clear inputs
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setRelationship('Friend');
    
    showToast('Contact added to safety lifeline!');
  };

  // ==========================================
  // TAB 3: Emergency Distress Message Setup
  // ==========================================
  const [situationError, setSituationError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleSaveSituation = async () => {
    if (!newSituation.trim()) {
      setSituationError('Distress summary cannot be empty.');
      return;
    }
    if (newSituation.length > 300) {
      setSituationError('Distress summary cannot exceed 300 characters.');
      return;
    }
    setSituationError('');
    await updateSituation(newSituation.trim());
    showToast('Emergency situation summary saved!');
  };

  const handleAIAssist = async () => {
    if (!newSituation.trim()) {
      setSituationError('Please type some basic notes first (e.g. hostel block, room number, or current activity) so the AI can help.');
      return;
    }
    setSituationError('');
    setAiLoading(true);
    
    // Simulate high-quality Claude API parsing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const text = newSituation.trim().toLowerCase();
    let resultText = '';

    if (text.includes('hostel') || text.includes('room') || text.includes('block') || text.includes('dorm')) {
      resultText = 'I am currently inside my hostel room and require urgent assistance. Please contact the hostel warden or call campus security immediately.';
    } else if (text.includes('follow') || text.includes('walk') || text.includes('outside') || text.includes('dark')) {
      resultText = 'I feel unsafe while walking on campus and suspect I am being followed. Please check my live location and contact campus security escorts immediately.';
    } else if (text.includes('library') || text.includes('lab') || text.includes('center')) {
      resultText = 'I am currently stuck in the academic facility and feel in imminent danger. Please call emergency services and monitor my active GPS location.';
    } else {
      resultText = `I am facing a campus safety emergency and need help. Pre-written details: "${newSituation.trim()}". Please send assistance to my geocoded location.`;
    }

    setNewSituation(resultText);
    setAiLoading(false);
    showToast('AI Assist generated a calm emergency summary!');
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View className="mb-6 pt-2">
            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-widest pl-0.5">
              SETUP
            </Text>
            <Text className="text-2xl font-black text-neutral-800 tracking-tight mt-0.5">
              Safety Configuration
            </Text>
          </View>

          {/* Elegant Sub-Tab Selector */}
          <View className="flex-row bg-white border border-neutral-100 rounded-2xl p-1.5 shadow-sm mb-6">
            <TouchableOpacity 
              onPress={() => setActiveTab('phrase')}
              className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
                activeTab === 'phrase' ? 'bg-primary-500 shadow-sm' : ''
              }`}
            >
              <Text className={`text-[11px] font-bold tracking-tight ${
                activeTab === 'phrase' ? 'text-white' : 'text-neutral-500'
              }`}>
                Code Phrase
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('contacts')}
              className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
                activeTab === 'contacts' ? 'bg-primary-500 shadow-sm' : ''
              }`}
            >
              <Text className={`text-[11px] font-bold tracking-tight ${
                activeTab === 'contacts' ? 'text-white' : 'text-neutral-500'
              }`}>
                Contacts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setActiveTab('situation')}
              className={`flex-1 items-center justify-center py-2.5 rounded-xl ${
                activeTab === 'situation' ? 'bg-primary-500 shadow-sm' : ''
              }`}
            >
              <Text className={`text-[11px] font-bold tracking-tight ${
                activeTab === 'situation' ? 'text-white' : 'text-neutral-500'
              }`}>
                My Situation
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: CODE PHRASE */}
          {activeTab === 'phrase' && (
            <View className="space-y-5">
              {/* Show current saved state */}
              {codePhrase ? (
                <View className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex-row items-center space-x-3">
                  <CheckCircle2 size={18} color="#10b981" />
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Active Cover Phrase</Text>
                    <Text className="text-xs font-bold text-emerald-800 mt-0.5">"{codePhrase}"</Text>
                  </View>
                </View>
              ) : (
                <View className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex-row items-center space-x-3">
                  <AlertCircle size={18} color="#f59e0b" />
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">No Phrase Configured</Text>
                    <Text className="text-xs font-medium text-amber-800 mt-0.5">Please write an innocent-looking cover phrase below.</Text>
                  </View>
                </View>
              )}

              <Card 
                title="Decoy Cover Phrase" 
                subtitle="Your hidden distress safe phrase"
              >
                <View className="space-y-4">
                  {phraseError ? (
                    <View className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <Text className="text-xs font-semibold text-red-500">{phraseError}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Safe Message Phrase"
                    placeholder="e.g. Hey, did we have homework for tomorrow?"
                    value={newPhrase}
                    onChangeText={setNewPhrase}
                    maxLength={80}
                    multiline
                    numberOfLines={2}
                    className="h-16 text-sm"
                  />

                  {/* Character Counter & Helper text */}
                  <View className="flex-row justify-between items-center px-1">
                    <Text className="text-[10px] font-semibold text-neutral-400">
                      Characters: {newPhrase.length}/80
                    </Text>
                  </View>

                  <Text className="text-[10px] font-semibold text-primary-500 leading-4 italic pl-1">
                    * Helper: This exact phrase, when sent through SilentSOS, will silently trigger your SOS alert
                  </Text>

                  <Button
                    onPress={handleSavePhrase}
                    title="Save Code Phrase"
                    variant="primary"
                    className="w-full mt-2"
                    disabled={newPhrase.length > 80}
                  />
                </View>
              </Card>

              <Card title="Innocent Cover Design Guidelines" className="mb-12">
                <Text className="text-xs text-neutral-400 leading-5">
                  Pick a phrase you naturally text when walking around campus. Make it sound standard and casual to ensure complete discretion in public areas.
                </Text>
              </Card>
            </View>
          )}

          {/* TAB 2: TRUSTED CONTACTS */}
          {activeTab === 'contacts' && (
            <View className="space-y-5">
              {/* Form to add contacts */}
              <Card title="Add Contact" subtitle="Set up your emergency lifeline network">
                <View className="space-y-4">
                  {contactError ? (
                    <View className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <Text className="text-xs font-semibold text-red-500">{contactError}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Name"
                    placeholder=" Sarah Connor"
                    value={contactName}
                    onChangeText={setContactName}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="e.g. +1 555-123-4567"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                  />

                  <Input
                    label="Email Address"
                    placeholder="name@college.edu"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  {/* Relationship selector chips */}
                  <View className="space-y-1.5 pl-1">
                    <Text className="text-[10px] font-bold text-neutral-400 uppercase">Relationship</Text>
                    <View className="flex-row flex-wrap gap-2 mt-1">
                      {(['Friend', 'Parent', 'RA', 'Warden'] as const).map((r) => (
                        <TouchableOpacity
                          key={r}
                          onPress={() => setRelationship(r)}
                          className={`px-4 py-2 rounded-xl border ${
                            relationship === r 
                              ? 'bg-primary-50 border-primary-200' 
                              : 'bg-white border-neutral-200'
                          }`}
                        >
                          <Text className={`text-[11px] font-bold ${
                            relationship === r ? 'text-primary-600' : 'text-neutral-500'
                          }`}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <Button
                    onPress={handleAddContact}
                    title={contacts.length >= 3 ? 'Max 3 Contacts Added' : 'Add Trusted Contact'}
                    variant="primary"
                    disabled={contacts.length >= 3}
                    leftIcon={<Plus size={16} color="white" />}
                    className="w-full mt-2"
                  />
                </View>
              </Card>

              {/* Contacts Directory */}
              <View className="mb-12">
                <View className="flex-row items-center justify-between mb-4 pl-1">
                  <View className="flex-row items-center space-x-2">
                    <Users size={16} color="#6b7280" />
                    <Text className="text-sm font-bold text-neutral-800 ml-1">
                      Lifeline Network ({contacts.length}/3)
                    </Text>
                  </View>
                </View>

                {contacts.length === 0 ? (
                  <Card className="items-center py-8">
                    <AlertCircle size={32} color="#f59e0b" strokeWidth={1.5} />
                    <Text className="text-sm font-semibold text-neutral-700 mt-3">Empty Lifeline Directory</Text>
                    <Text className="text-xs text-neutral-400 text-center mt-1 px-6 leading-5">
                      You must add at least one trusted contact (up to 3) to receive distress coordinates.
                    </Text>
                  </Card>
                ) : (
                  <View className="space-y-3">
                    {contacts.map((item) => (
                      <View 
                        key={item.id} 
                        className="bg-white border border-neutral-100 rounded-2xl p-4 flex-row items-center justify-between shadow-sm"
                      >
                        <View className="flex-1 pr-4">
                          <View className="flex-row items-center space-x-2">
                            <Text className="text-sm font-bold text-neutral-800">{item.name}</Text>
                            <View className="bg-primary-50 px-2 py-0.5 rounded-md">
                              <Text className="text-[9px] font-black text-primary-600 uppercase tracking-tight">
                                {item.relationship || 'Friend'}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-[11px] text-neutral-400 mt-1">{item.phone}  •  {item.email}</Text>
                        </View>
                        
                        <TouchableOpacity 
                          onPress={() => removeContact(item.id)}
                          className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 items-center justify-center"
                        >
                          <Trash2 size={13} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 3: MY SITUATION */}
          {activeTab === 'situation' && (
            <View className="space-y-5">
              {/* Show current saved state */}
              {situation ? (
                <View className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex-row items-center space-x-3">
                  <CheckCircle2 size={18} color="#10b981" />
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Saved Distress Payload</Text>
                    <Text className="text-xs font-bold text-emerald-800 mt-0.5" numberOfLines={2}>"{situation}"</Text>
                  </View>
                </View>
              ) : (
                <View className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex-row items-center space-x-3">
                  <AlertCircle size={18} color="#f59e0b" />
                  <View className="flex-1 ml-2">
                    <Text className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Payload Empty</Text>
                    <Text className="text-xs font-medium text-amber-800 mt-0.5">Please pre-write an emergency message below.</Text>
                  </View>
                </View>
              )}

              <Card 
                title="Distress Warning Payload" 
                subtitle="Pre-written summary dispatched secretly"
              >
                <View className="space-y-4">
                  {situationError ? (
                    <View className="bg-red-50 border border-red-100 rounded-xl p-3">
                      <Text className="text-xs font-semibold text-red-500">{situationError}</Text>
                    </View>
                  ) : null}

                  <Input
                    label="Emergency Situation Summary"
                    placeholder="Describe your situation so your contacts know what to do. E.g. I may be in danger at Hostel B Room 214. Please contact the warden or call campus security."
                    value={newSituation}
                    onChangeText={setNewSituation}
                    maxLength={300}
                    multiline
                    numberOfLines={4}
                    className="h-24 text-xs leading-5"
                  />

                  {/* Character Counter & Helper Buttons */}
                  <View className="flex-row justify-between items-center px-1">
                    <Text className="text-[10px] font-semibold text-neutral-400">
                      Characters: {newSituation.length}/300
                    </Text>

                    {/* AI Assist Button */}
                    <TouchableOpacity 
                      onPress={handleAIAssist}
                      disabled={aiLoading || !newSituation.trim()}
                      className={`flex-row items-center space-x-1.5 px-3 py-1.5 rounded-lg border ${
                        !newSituation.trim() 
                          ? 'border-neutral-200 bg-neutral-50' 
                          : 'border-indigo-200 bg-indigo-50/50'
                      }`}
                    >
                      <Sparkles size={11} color={!newSituation.trim() ? '#9ca3af' : '#6366f1'} />
                      <Text className={`text-[10px] font-bold ${
                        !newSituation.trim() ? 'text-neutral-400' : 'text-indigo-600'
                      }`}>
                        {aiLoading ? 'Drafting...' : 'AI Assist'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Button
                    onPress={handleSaveSituation}
                    title="Save Message Payload"
                    variant="primary"
                    className="w-full mt-2"
                    disabled={newSituation.length > 300}
                  />
                </View>
              </Card>

              <Card title="Distress Optimization Tips" className="mb-12">
                <Text className="text-xs text-neutral-400 leading-5">
                  Keep instructions action-oriented. Provide precise details like your hostel block number, roommate contacts, or common security pathways so rescuers can intervene immediately.
                </Text>
              </Card>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Tactical Confirmation Toast */}
      <Animated.View 
        style={{ opacity: toastOpacity }}
        className="absolute bottom-6 left-6 right-6 bg-neutral-800 rounded-2xl py-3.5 px-5 flex-row items-center justify-center space-x-2 shadow-lg z-50 pointer-events-none"
      >
        <CheckCircle2 size={15} color="#10b981" />
        <Text className="text-white text-xs font-bold pl-1.5">{toastMsg}</Text>
      </Animated.View>

    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import { View, Text, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { EyeOff, ShieldCheck, HelpCircle, ArrowRight } from 'lucide-react-native';
import { Button } from '../../components/Button';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function Onboarding() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      icon: <EyeOff size={48} color="#1a56db" strokeWidth={1.5} />,
      title: "Innocent Cover",
      description: "SilentSOS is disguised as a normal messaging app. It contains no alarming icons or loud screens to avoid drawing suspicious attention.",
    },
    {
      id: 2,
      icon: <HelpCircle size={48} color="#1a56db" strokeWidth={1.5} />,
      title: "Smart Safe Words",
      description: "You set a normal trigger phrase (e.g. asking to study). When typed in our chat, the silent distress alarm fires immediately under the hood.",
    },
    {
      id: 3,
      icon: <ShieldCheck size={48} color="#1a56db" strokeWidth={1.5} />,
      title: "Immediate Lifeline",
      description: "Your trusted contacts instantly receive your precise real-time GPS location and a custom safety message without anyone nearby knowing.",
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const activeSlide = slides[currentSlide];

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 justify-between">
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-6 pt-4">
        <Text className="text-xl font-bold text-neutral-800 tracking-tight">
          Silent<Text className="text-primary-500">SOS</Text>
        </Text>
        
        {currentSlide < slides.length - 1 && (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-sm font-semibold text-neutral-400">Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Center Interactive Slider Slide */}
      <View className="flex-1 justify-center px-8 items-center">
        {/* Animated Glow Halo */}
        <View className="absolute w-64 h-64 rounded-full bg-primary-100/20 blur-3xl" />

        {/* Icon Container */}
        <View className="w-24 h-24 rounded-[32px] bg-white border border-neutral-100 items-center justify-center shadow-sm mb-10 relative">
          <View className="absolute w-20 h-20 rounded-[26px] border border-primary-50/50" />
          {activeSlide.icon}
        </View>

        {/* Title */}
        <Text className="text-2xl font-extrabold text-neutral-800 text-center tracking-tight px-4 leading-8">
          {activeSlide.title}
        </Text>

        {/* Description */}
        <Text className="text-sm font-medium text-neutral-400 text-center mt-4 leading-6 max-w-xs">
          {activeSlide.description}
        </Text>
      </View>

      {/* Bottom Controls */}
      <View className="px-6 pb-12 items-center">
        {/* Progress dots */}
        <View className="flex-row space-x-2 mb-8">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-6 bg-primary-500' : 'w-2 bg-neutral-200'
              }`}
            />
          ))}
        </View>

        {/* Next Button */}
        <Button
          onPress={handleNext}
          title={currentSlide === slides.length - 1 ? "Get Started" : "Continue"}
          variant="primary"
          className="w-full"
          rightIcon={currentSlide === slides.length - 1 ? <ArrowRight size={16} color="white" /> : undefined}
        />
      </View>
    </SafeAreaView>
  );
}

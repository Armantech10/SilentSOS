import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  className?: string;
  headerRight?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  onPress,
  className = '',
  headerRight,
}) => {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      onPress={onPress}
      activeOpacity={0.9}
      className={`bg-white border border-neutral-100 rounded-3xl p-5 shadow-sm active:opacity-95 ${className}`}
    >
      {(title || subtitle || headerRight) && (
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 pr-2">
            {title && (
              <Text className="text-base font-semibold text-neutral-800 tracking-tight">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text className="text-xs text-neutral-400 mt-0.5">
                {subtitle}
              </Text>
            )}
          </View>
          {headerRight && <View className="ml-2">{headerRight}</View>}
        </View>
      )}
      
      <View>{children}</View>
    </CardContainer>
  );
};

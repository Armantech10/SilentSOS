import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  leftIcon,
  rightIcon,
}) => {
  const baseStyle = 'flex-row items-center justify-center rounded-2xl active:opacity-90 transition-all duration-200';
  
  const variantStyles = {
    primary: 'bg-primary-500 border border-primary-600 shadow-sm',
    secondary: 'bg-neutral-100 border border-neutral-200',
    outline: 'bg-transparent border border-neutral-300',
    danger: 'bg-red-500 border border-red-600 shadow-sm',
  };

  const textVariantStyles = {
    primary: 'text-white font-semibold',
    secondary: 'text-neutral-700 font-semibold',
    outline: 'text-neutral-700 font-semibold',
    danger: 'text-white font-semibold',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5 text-base',
    lg: 'px-8 py-4.5 text-lg',
  };

  const textSizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#1a56db'} size="small" />
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
          {leftIcon && <View className="mr-2">{leftIcon}</View>}
          <Text className={`${textVariantStyles[variant]} ${textSizeStyles[size]}`}>
            {title}
          </Text>
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

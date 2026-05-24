import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerClassName = '',
  leftIcon,
  rightIcon,
  className = '',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`w-full flex-col space-y-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-1">
          {label}
        </Text>
      )}
      
      <View 
        className={`w-full flex-row items-center border rounded-2xl bg-neutral-50 px-4 py-3.5 transition-all duration-200 ${
          isFocused 
            ? 'border-primary-500 bg-white ring-1 ring-primary-500' 
            : error 
              ? 'border-red-400 bg-red-50/10' 
              : 'border-neutral-200'
        }`}
      >
        {leftIcon && <View className="mr-3 text-neutral-400">{leftIcon}</View>}
        
        <TextInput
          className={`flex-1 text-sm text-neutral-800 focus:outline-none p-0 m-0 ${className}`}
          placeholderTextColor="#9ca3af"
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...props}
        />
        
        {rightIcon && <View className="ml-3 text-neutral-400">{rightIcon}</View>}
      </View>
      
      {error && (
        <Text className="text-xs text-red-500 pl-1 mt-0.5">
          {error}
        </Text>
      )}
    </View>
  );
};

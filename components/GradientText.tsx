import React from 'react';
import { Text, StyleSheet, TextStyle, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
  children: string;
  style?: TextStyle;
  colors?: string[];
}

export function GradientText({ children, style, colors }: GradientTextProps) {
  // Default gradient: dark gold at bottom to lighter gold at top
  // Main color: #D4A444
  const defaultColors: [string, string, ...string[]] = (colors && colors.length >= 2 
    ? colors as [string, string, ...string[]]
    : [
        '#9D7A2F', // Darker shade of #D4A444 at bottom (40% darker)
        '#B88D39', // Medium-dark shade (20% darker)
        '#D4A444', // Main color in middle
        '#E0B55A', // Lighter shade at top (10% lighter)
      ]) as [string, string, ...string[]];

  // For web or if MaskedView is not available, use solid color
  if (Platform.OS === 'web') {
    return (
      <Text style={[styles.text, style, { color: '#D4A444' }]}>
        {children}
      </Text>
    );
  }

  // Use MaskedView for gradient effect on native platforms
  // Wrap in View to ensure proper layout constraints
  return (
    <View style={styles.wrapper}>
      <MaskedView
        style={styles.maskedView}
        maskElement={
          <View style={styles.maskContainer}>
            <Text style={[styles.text, style, { color: '#fff' }]}>
              {children}
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={defaultColors}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.maskContainer}>
            <Text style={[styles.text, style, { color: 'transparent' }]}>
              {children}
            </Text>
          </View>
        </LinearGradient>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskedView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});


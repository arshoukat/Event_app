import React, { useState } from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
  style?: any;
}

// Load logo at module level - this ensures it's bundled correctly
const logoSource = require('../assets/logo.png');

export function Logo({ size = 64, showText = false, style }: LogoProps) {
  const [imageError, setImageError] = useState(false);

  // If image fails to load, show placeholder
  if (imageError) {
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.placeholderLogo, { width: size, height: size, borderRadius: size / 4 }]}>
          <View style={styles.placeholderInner}>
            <View style={[styles.placeholderCircle, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
        onError={(error) => {
          console.log('Logo image failed to load:', error);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Logo image loaded successfully');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  placeholderLogo: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  placeholderInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderCircle: {
    backgroundColor: '#fff',
  },
});


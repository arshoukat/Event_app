import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';

// Polyfill for TextEncoder/TextDecoder (required for react-native-qrcode-svg)
import { TextEncoder, TextDecoder } from 'text-encoding';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

export default function QRCodeModalScreen() {
  const router = useRouter();
  const { url, eventId } = useLocalSearchParams();
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const urlValue = Array.isArray(url) ? String(url[0]) : String(url || '');
    if (urlValue && urlValue !== 'undefined' && urlValue !== 'null') {
      setQrUrl(decodeURIComponent(urlValue));
    }
  }, [url]);

  const handleSaveQRCode = async () => {
    if (!qrUrl) {
      Alert.alert('Error', 'No QR code URL available');
      return;
    }

    try {
      // Try to dynamically import MediaLibrary only when needed
      let MediaLibrary: any;
      try {
        MediaLibrary = await import('expo-media-library');
        // Handle both default and named exports
        if (MediaLibrary.default) {
          MediaLibrary = MediaLibrary.default;
        }
      } catch (importError) {
        console.warn('expo-media-library not available:', importError);
        Alert.alert(
          'Feature Unavailable',
          'QR code saving requires the app to be rebuilt with expo-media-library. Please run: npx expo prebuild && npx expo run:ios\n\nFor now, you can screenshot the QR code.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to save the QR code.'
        );
        return;
      }

      // Generate QR code as SVG data URI (this is a simplified version)
      // In a real implementation, you might want to use a library that can render to image
      Alert.alert(
        'Info',
        'QR code saving feature requires additional setup. For now, you can screenshot the QR code.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      console.error('Failed to save QR code:', err);
      // If it's a native module error, show a helpful message
      if (err?.message?.includes('native module') || err?.message?.includes('ExpoMediaLibrary')) {
        Alert.alert(
          'Feature Unavailable',
          'QR code saving requires the app to be rebuilt. Please run: npx expo prebuild && npx expo run:ios\n\nFor now, you can screenshot the QR code.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save QR code. Please try again.');
      }
    }
  };

  if (!qrUrl) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Code</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>No URL provided</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrUrl}
            size={280}
            color="#000"
            backgroundColor="#fff"
          />
        </View>

        <Text style={styles.hintText}>Scan this QR code to join the event</Text>
        <Text style={styles.urlText} numberOfLines={2} ellipsizeMode="middle">
          {qrUrl}
        </Text>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveQRCode}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  qrCodeContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hintText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  urlText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


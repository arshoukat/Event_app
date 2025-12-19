import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { mockUser } from '../data/mockData';
import { ImageWithFallback } from '../components/ImageWithFallback';

export default function EditProfileScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [fullName, setFullName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [phoneNumber, setPhoneNumber] = useState(mockUser.phone);
  const [location, setLocation] = useState(mockUser.location || '');
  const [bio, setBio] = useState(mockUser.bio || '');

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    // TODO: Implement actual save logic
    Alert.alert('Success', 'Profile updated successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const handleChangePhoto = () => {
    // TODO: Implement image picker
    Alert.alert('Info', 'Image picker functionality will be implemented');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>{t('editProfile.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <ImageWithFallback
              source={{ uri: mockUser.avatar }}
              style={styles.profilePhoto}
              fallbackComponent={
                <View style={styles.profilePhotoPlaceholder}>
                  <Ionicons name="person" size={40} color="#9ca3af" />
                </View>
              }
            />
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={handleChangePhoto}
            >
              <Ionicons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>{t('editProfile.changeProfilePhoto')}</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color="#9ca3af" 
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('editProfile.fullName')}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color="#9ca3af" 
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('editProfile.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.phoneNumber')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="call-outline" 
                size={20} 
                color="#9ca3af" 
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('editProfile.phoneNumber')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.location')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="location-outline" 
                size={20} 
                color="#9ca3af" 
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('editProfile.location')}
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.bio')}</Text>
            <View style={styles.bioWrapper}>
              <TextInput
                style={[styles.bioInput, isRTL && styles.bioInputRTL]}
                placeholder={t('editProfile.bioPlaceholder')}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
  saveButton: {
    fontSize: 16,
    color: '#D4A444',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
  },
  profilePhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4A444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#D4A444',
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#374151',
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputIconRTL: {
    left: 'auto',
    right: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  inputRTL: {
    paddingLeft: 16,
    paddingRight: 44,
  },
  bioWrapper: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  bioInput: {
    fontSize: 16,
    color: '#000',
    minHeight: 100,
  },
  bioInputRTL: {
    textAlign: 'right',
  },
});

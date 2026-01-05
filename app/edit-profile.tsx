import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

export default function EditProfileScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch user profile to auto-populate fields (especially email)
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = await storageService.getToken();
        if (!token) {
          console.warn('No token found, user may need to login');
          setLoadingProfile(false);
          return;
        }

        const response = await apiService.get<{
          success?: boolean;
          data?: {
            email?: string;
            name?: string;
            phone?: string;
            bio?: string;
          };
          email?: string;
          name?: string;
          phone?: string;
          bio?: string;
        }>('/users/profile');

        // Handle different response formats
        const profileData = response.data || response;
        
        if (profileData.email) {
          setEmail(profileData.email);
        }
        if (profileData.name) {
          setFullName(profileData.name);
        }
        if (profileData.phone) {
          // Remove +966 prefix if present for display (we'll add it back on save)
          const phoneWithoutPrefix = profileData.phone.replace(/^\+966/, '').replace(/^966/, '');
          setPhoneNumber(phoneWithoutPrefix);
        }
        if (profileData.bio) {
          setBio(profileData.bio);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // If profile doesn't exist yet, that's okay - user will fill it in
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  // Format phone number for KSA (Saudi Arabia) - +966 prefix
  const formatKSAPhone = (phone: string) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '');
    // If starts with 966, keep it; otherwise add +966 prefix
    if (digits.startsWith('966')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      // Remove leading 0 and add +966
      return `+966${digits.substring(1)}`;
    } else if (digits.length > 0) {
      return `+966${digits}`;
    }
    return '';
  };

  const handlePhoneChange = (text: string) => {
    // Allow only digits
    const digits = text.replace(/\D/g, '');
    // Limit to 9 digits (KSA phone numbers are typically 9 digits after country code)
    if (digits.length <= 9) {
      setPhoneNumber(digits);
    }
  };

  const handleSave = async () => {
    // Validate all fields are mandatory
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('editProfile.fullName') + ' is required');
      return;
    }
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('editProfile.email') + ' is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), 'Please enter a valid email address');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert(t('common.error'), t('editProfile.phoneNumber') + ' is required');
      return;
    }
    if (phoneNumber.length < 9) {
      Alert.alert(t('common.error'), 'Phone number must be at least 9 digits');
      return;
    }
    if (!bio.trim()) {
      Alert.alert(t('common.error'), t('editProfile.bio') + ' is required');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatKSAPhone(phoneNumber);
      const response = await apiService.put('/users/profile', {
        name: fullName.trim(),
        phone: formattedPhone,
        bio: bio.trim(),
      });
      
      console.log('Profile updated successfully:', response);
      
      Alert.alert(
        t('common.success'),
        'Profile updated successfully',
        [
          { 
            text: 'OK', 
            onPress: () => {
              router.back();
            }
          }
        ]
      );
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errorMessage = err?.message || 'Failed to save profile. Please try again.';
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#D4A444" />
          ) : (
            <Text style={styles.saveButton}>{t('editProfile.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('editProfile.fullName')} <Text style={styles.required}>*</Text>
            </Text>
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
            <Text style={styles.label}>
              {t('editProfile.email')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color="#9ca3af" 
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL, styles.inputDisabled]}
                placeholder={t('editProfile.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9ca3af"
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('editProfile.phoneNumber')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.phonePrefix}>{t('editProfile.phoneKSAPrefix')}</Text>
              <TextInput
                style={[styles.input, styles.phoneInput, isRTL && styles.inputRTL]}
                placeholder={t('editProfile.phonePlaceholder')}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <Text style={styles.hint}>Saudi Arabia phone number (9 digits)</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('editProfile.bio')} <Text style={styles.required}>*</Text>
            </Text>
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
  required: {
    color: '#ef4444',
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
  phonePrefix: {
    position: 'absolute',
    left: 44,
    zIndex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  phonePrefixRTL: {
    left: 'auto',
    right: 44,
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
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  phoneInput: {
    paddingLeft: 80,
  },
  phoneInputRTL: {
    paddingLeft: 16,
    paddingRight: 80,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
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

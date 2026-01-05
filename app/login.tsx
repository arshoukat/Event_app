import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Logo } from '../components/Logo';
import { GradientText } from '../components/GradientText';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { LanguageToggle } from '../components/LanguageToggle';

export default function LoginScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post<{
        success: boolean;
        message: string;
        data: {
          _id: string;
          name: string;
          email: string;
          phone?: string;
          bio?: string;
          iban?: string;
          role: string;
          token: string;
        };
      }>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data?.token) {
        // Store token and user data (including IBAN if present)
        await storageService.setToken(response.data.token);
        await storageService.setUser({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          bio: response.data.bio,
          iban: response.data.iban, // Save IBAN from login response
          role: response.data.role,
        });

        // Redirect to home page immediately
        router.replace('/home');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login failed', err);
      console.log('Error details:', {
        status: err.status,
        message: err.message,
        data: err.data
      });
      
      // Extract error message from backend response
      let errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      
      // Check error data first (contains the backend response)
      if (err.data && err.data.message) {
        errorMessage = err.data.message;
        // If it's a backend function error, provide a more user-friendly message
        if (errorMessage.includes('getDecryptedIban is not a function')) {
          errorMessage = 'Login service error. Please contact support or try again later.';
        }
      }
      // Check error message (API service extracts message from response)
      else if (err.message && !err.message.includes('HTTP error')) {
        errorMessage = err.message;
        // If it's a backend function error, provide a more user-friendly message
        if (errorMessage.includes('getDecryptedIban is not a function')) {
          errorMessage = 'Login service error. Please contact support or try again later.';
        }
      }
      
      // Always show alert popup
      Alert.alert(
        'Authentication Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.languageToggleContainer}>
        <LanguageToggle />
      </View>
      <View style={styles.header}>
        <Logo size={120} />
        {Platform.OS === 'web' ? (
          <GradientText style={styles.appName}>Ducat</GradientText>
        ) : (
          <Text style={[styles.appName, { color: '#D4A444' }]}>Ducat</Text>
        )}
        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.emailRequired')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color="#9ca3af" 
              style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
            />
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="example@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('auth.password')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color="#9ca3af" 
              style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
            />
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t('auth.enterPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={[styles.eyeIcon, isRTL && styles.eyeIconRTL]}
            >
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color="#9ca3af" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.row, isRTL && styles.rowRTL]}>
          <View style={[styles.checkboxRow, isRTL && styles.checkboxRowRTL]}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#e5e7eb', true: '#D4A444' }}
              thumbColor="#fff"
            />
            <Text style={styles.checkboxLabel}>{t('auth.rememberMe')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : t('auth.signIn')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  languageToggleContainer: {
    position: 'absolute',
    top: 20,
    right: 24,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 20,
    letterSpacing: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#374151',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingLeft: 44,
    paddingRight: 44,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputRTL: {
    paddingLeft: 44,
    paddingRight: 44,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  eyeIconRTL: {
    right: 'auto',
    left: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rowRTL: {
    flexDirection: 'row-reverse',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxRowRTL: {
    flexDirection: 'row-reverse',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#D4A444',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#D4A444',
    fontWeight: '600',
  },
});


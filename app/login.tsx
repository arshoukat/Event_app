import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Logo } from '../components/Logo';
import { GradientText } from '../components/GradientText';

export default function LoginScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = () => {
    // TODO: Implement actual login logic
    router.replace('/home');
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
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
          <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons 
              name="call-outline" 
              size={20} 
              color="#9ca3af" 
              style={[styles.inputIcon, isRTL && styles.inputIconRTL]} 
            />
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="+1 (555) 000-0000"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
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


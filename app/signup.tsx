import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Logo } from '../components/Logo';
import { GradientText } from '../components/GradientText';
import { apiService } from '../services/api';
import { LanguageToggle } from '../components/LanguageToggle';

type SignupStep = 'email' | 'otp' | 'profile';

export default function SignupScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSignup, setLoadingSignup] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoadingSend(true);
    try {
      await apiService.post('/auth/signup/initiate', { email });
      Alert.alert('Success', 'OTP sent to your email');
      setStep('otp');
    } catch (err) {
      console.error('Send OTP failed', err);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoadingSend(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      setLoadingVerify(true);
      try {
        await apiService.post('/auth/signup/verify', { email, otp: otpCode });
        Alert.alert('Success', 'OTP verified');
        setStep('profile');
      } catch (err) {
        console.error('Verify OTP failed', err);
        Alert.alert('Error', 'Invalid or expired OTP. Please try again.');
      } finally {
        setLoadingVerify(false);
      }
    } else {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
    }
  };

  const handleCompleteSignup = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', t('auth.passwordsDoNotMatch'));
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the terms and conditions');
      return;
    }
    setLoadingSignup(true);
    try {
      const response = await apiService.post('/auth/signup/complete', {
        email,
        name: fullName,
        password,
        confirmPassword,
      });
      console.log('Signup successful:', response);
      
      // Reset loading state
      setLoadingSignup(false);
      
      // Show success alert
      Alert.alert(
        'Success', 
        'Your account is created successfully, please login',
        [
          { 
            text: 'OK', 
            onPress: () => {
              console.log('Alert OK pressed');
            }
          }
        ],
        { cancelable: false }
      );
      
      // Redirect immediately after showing alert
      // Using setTimeout to ensure Alert is displayed first
      setTimeout(() => {
        console.log('Redirecting to login page...');
        router.replace('/login');
      }, 500);
    } catch (err: any) {
      console.error('Signup failed', err);
      setLoadingSignup(false);
      const errorMessage = err?.message || 'Failed to create account. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await apiService.post('/auth/signup/initiate', { email });
      Alert.alert('Success', 'OTP resent to your email');
    } catch (err) {
      console.error('Resend OTP failed', err);
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setIsResending(false);
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
        <Text style={styles.title}>
          {step === 'email' && t('auth.createAccount')}
          {step === 'otp' && t('auth.verifyOTP')}
          {step === 'profile' && t('auth.completeProfile')}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'email' && t('auth.enterEmailToGetStarted')}
          {step === 'otp' && `${t('auth.sentCodeTo')} ${email}`}
          {step === 'profile' && t('auth.tellAboutYourself')}
        </Text>
      </View>

      {/* Step 1: Email */}
      {step === 'email' && (
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
            <Text style={styles.hint}>{t('auth.verificationCode')}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, loadingSend && styles.buttonDisabled]} 
            onPress={handleSendOTP}
            disabled={loadingSend}
          >
            <Text style={styles.buttonText}>
              {loadingSend ? 'Sending...' : t('auth.sendOTP')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step 2: OTP Verification */}
      {step === 'otp' && (
        <View style={styles.form}>
          <TouchableOpacity
            onPress={() => setStep('email')}
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
          >
            <Ionicons name="arrow-back" size={16} color="#6b7280" />
            <Text style={styles.backButtonText}>{t('auth.changeEmail')}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>{t('auth.enterDigitCode')}</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (otpRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={(e) => handleOtpKeyDown(index, e)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>{t('auth.didntReceiveCode')} </Text>
            <TouchableOpacity onPress={handleResendOTP} disabled={isResending}>
              <Text style={[styles.resendLink, isResending && styles.resendLinkDisabled]}>
                {isResending ? t('auth.sending') : t('auth.resendOTP')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, loadingVerify && styles.buttonDisabled]} 
            onPress={handleVerifyOTP}
            disabled={loadingVerify}
          >
            <Text style={styles.buttonText}>
              {loadingVerify ? 'Verifying...' : t('auth.verifyAndContinue')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Profile Information */}
      {step === 'profile' && (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#9ca3af"
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('auth.enterFullName')}
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.createPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9ca3af"
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('auth.createPasswordPlaceholder')}
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

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9ca3af"
                style={[styles.inputIcon, isRTL && styles.inputIconRTL]}
              />
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={[styles.termsRow, isRTL && styles.termsRowRTL]}>
            <Switch
              value={acceptTerms}
              onValueChange={setAcceptTerms}
              trackColor={{ false: '#e5e7eb', true: '#D4A444' }}
              thumbColor="#fff"
            />
            <Text style={styles.termsText}>
              {t('auth.termsAccept')} <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text> {t('auth.and')} <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, loadingSignup && styles.buttonDisabled]} 
            onPress={handleCompleteSignup}
            disabled={loadingSignup}
          >
            <Text style={styles.buttonText}>
              {loadingSignup ? 'Creating...' : t('auth.createAccountButton')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.footerLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, step === 'email' && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === 'otp' && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === 'profile' && styles.progressDotActive]} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf5ff',
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
    marginBottom: 32,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backButtonRTL: {
    flexDirection: 'row-reverse',
  },
  backButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#D4A444',
  },
  resendLinkDisabled: {
    color: '#9ca3af',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  termsRowRTL: {
    flexDirection: 'row-reverse',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  termsLink: {
    color: '#D4A444',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
  },
  progressDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  progressDotActive: {
    backgroundColor: '#D4A444',
  },
});


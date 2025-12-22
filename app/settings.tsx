import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { language, setLanguage, t, isRTL } = useLanguage();
  const router = useRouter();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleChangePassword = () => {
    router.push('/forgot-password');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Account deletion will be implemented');
          },
        },
      ]
    );
  };

  type SettingItem = 
    | {
        icon: string;
        label: string;
        value: boolean;
        onToggle: (value: boolean) => void;
        type: 'switch';
        subtitle?: string;
        destructive?: boolean;
      }
    | {
        icon: string;
        label: string;
        type: 'navigation';
        onPress: () => void;
        destructive?: boolean;
        subtitle?: string;
      };

  const settingsSections: Array<{
    title: string;
    items: SettingItem[];
  }> = [
    {
      title: t('settings.notifications'),
      items: [
        {
          icon: 'notifications-outline',
          label: t('settings.pushNotifications'),
          value: pushNotifications,
          onToggle: setPushNotifications,
          type: 'switch' as const,
        },
        {
          icon: 'mail-outline',
          label: t('settings.emailNotifications'),
          value: emailNotifications,
          onToggle: setEmailNotifications,
          type: 'switch' as const,
        },
        {
          icon: 'alarm-outline',
          label: t('settings.eventReminders'),
          value: eventReminders,
          onToggle: setEventReminders,
          type: 'switch' as const,
        },
      ],
    },
    {
      title: t('settings.appearance'),
      items: [
        {
          icon: 'moon-outline',
          label: t('settings.darkMode'),
          value: darkMode,
          onToggle: setDarkMode,
          type: 'switch' as const,
        },
        {
          icon: 'language-outline',
          label: t('settings.language'),
          value: language === 'ar',
          onToggle: toggleLanguage,
          type: 'switch' as const,
          subtitle: language === 'en' ? t('settings.english') : t('settings.arabic'),
        },
      ],
    },
    {
      title: t('settings.privacySecurity'),
      items: [
        {
          icon: 'lock-closed-outline',
          label: t('settings.changePassword'),
          type: 'navigation' as const,
          onPress: handleChangePassword,
        },
        {
          icon: 'shield-checkmark-outline',
          label: t('settings.twoFactorAuth'),
          value: twoFactorAuth,
          onToggle: setTwoFactorAuth,
          type: 'switch' as const,
        },
        {
          icon: 'time-outline',
          label: t('settings.loginActivity'),
          type: 'navigation' as const,
          onPress: () => router.push('/login-activity'),
        },
        {
          icon: 'document-text-outline',
          label: t('settings.dataPrivacy'),
          type: 'navigation' as const,
          onPress: () => router.push('/data-privacy'),
        },
      ],
    },
    {
      title: t('settings.account'),
      items: [
        {
          icon: 'trash-outline',
          label: t('settings.deleteAccount'),
          type: 'navigation' as const,
          onPress: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.settingItem}
                  onPress={item.type === 'navigation' ? item.onPress : undefined}
                  activeOpacity={item.type === 'navigation' ? 0.7 : 1}
                  disabled={item.type === 'switch'}
                >
                  <View style={styles.settingItemLeft}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={(item.destructive ?? false) ? '#ef4444' : '#374151'} 
                    />
                    <View style={styles.settingItemText}>
                      <Text style={[
                        styles.settingItemLabel,
                        (item.destructive ?? false) && styles.settingItemLabelDestructive
                      ]}>
                        {item.label}
                      </Text>
                      {(item.subtitle ?? false) && (
                        <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  {item.type === 'switch' && (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#d1d5db', true: '#D4A444' }}
                      thumbColor="#fff"
                    />
                  )}
                  {item.type === 'navigation' && (
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            {t('settings.version')} 1.0.0
          </Text>
          <Text style={styles.copyrightText}>
            {t('settings.copyright')}
          </Text>
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
  placeholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  settingItemLabelDestructive: {
    color: '#ef4444',
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Language Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.languageContainer}>
            <View style={styles.languageRow}>
              <View style={styles.languageInfo}>
                <Ionicons name="language-outline" size={20} color="#6b7280" />
                <View style={styles.languageText}>
                  <Text style={styles.languageLabel}>{t('settings.language')}</Text>
                  <Text style={styles.languageValue}>
                    {language === 'en' ? t('settings.english') : t('settings.arabic')}
                  </Text>
                </View>
              </View>
              <Switch
                value={language === 'ar'}
                onValueChange={toggleLanguage}
                trackColor={{ false: '#d1d5db', true: '#9333ea' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  languageContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageText: {
    gap: 4,
  },
  languageLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  languageValue: {
    fontSize: 12,
    color: '#9ca3af',
  },
});


import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';

export default function DataPrivacyScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);
  const [dataSharing, setDataSharing] = useState(false);
  const [locationTracking, setLocationTracking] = useState(true);

  const handleDownloadData = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare your data and send it to your email address. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: () => {
            // TODO: Implement data download
            Alert.alert('Success', 'Your data download request has been submitted. You will receive an email shortly.');
          },
        },
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete all your data? This action cannot be undone and will permanently delete your account and all associated data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data deletion
            Alert.alert('Info', 'Data deletion will be implemented');
          },
        },
      ]
    );
  };

  const privacySections = [
    {
      title: 'Data Collection',
      items: [
        {
          icon: 'analytics-outline',
          label: 'Analytics & Usage Data',
          description: 'Help us improve the app by sharing anonymous usage data',
          value: analyticsEnabled,
          onToggle: setAnalyticsEnabled,
        },
        {
          icon: 'location-outline',
          label: 'Location Tracking',
          description: 'Allow the app to track your location for better event recommendations',
          value: locationTracking,
          onToggle: setLocationTracking,
        },
      ],
    },
    {
      title: 'Advertising',
      items: [
        {
          icon: 'megaphone-outline',
          label: 'Personalized Ads',
          description: 'Show ads based on your interests and activity',
          value: personalizedAds,
          onToggle: setPersonalizedAds,
        },
      ],
    },
    {
      title: 'Data Sharing',
      items: [
        {
          icon: 'share-social-outline',
          label: 'Share Data with Partners',
          description: 'Allow sharing anonymized data with trusted partners for research and improvement',
          value: dataSharing,
          onToggle: setDataSharing,
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
        <Text style={styles.headerTitle}>{t('settings.dataPrivacy')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#D4A444" />
          <Text style={styles.infoText}>
            Your privacy is important to us. Control how your data is collected, used, and shared.
          </Text>
        </View>

        {privacySections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.privacyItem}>
                  <View style={styles.privacyItemLeft}>
                    <Ionicons name={item.icon as any} size={20} color="#374151" />
                    <View style={styles.privacyItemText}>
                      <Text style={styles.privacyItemLabel}>{item.label}</Text>
                      <Text style={styles.privacyItemDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#d1d5db', true: '#D4A444' }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.dataActionItem}
              onPress={handleDownloadData}
            >
              <View style={styles.dataActionLeft}>
                <Ionicons name="download-outline" size={20} color="#374151" />
                <View style={styles.dataActionText}>
                  <Text style={styles.dataActionLabel}>Download Your Data</Text>
                  <Text style={styles.dataActionDescription}>
                    Request a copy of all your data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dataActionItem, styles.dataActionItemDestructive]}
              onPress={handleDeleteData}
            >
              <View style={styles.dataActionLeft}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <View style={styles.dataActionText}>
                  <Text style={[styles.dataActionLabel, styles.dataActionLabelDestructive]}>
                    Delete All Data
                  </Text>
                  <Text style={styles.dataActionDescription}>
                    Permanently delete your account and all data
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Policy Link */}
        <TouchableOpacity
          style={styles.privacyPolicyLink}
          onPress={() => router.push('/help-support')}
        >
          <Ionicons name="document-text-outline" size={20} color="#D4A444" />
          <Text style={styles.privacyPolicyText}>View Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
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
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
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
  privacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  privacyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  privacyItemText: {
    flex: 1,
  },
  privacyItemLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  privacyItemDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  dataActionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dataActionItemDestructive: {
    borderBottomWidth: 0,
  },
  dataActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dataActionText: {
    flex: 1,
  },
  dataActionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  dataActionLabelDestructive: {
    color: '#ef4444',
  },
  dataActionDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  privacyPolicyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  privacyPolicyText: {
    flex: 1,
    fontSize: 16,
    color: '#D4A444',
    fontWeight: '500',
  },
});


import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: string;
  isCurrent: boolean;
}

const mockLoginActivities: LoginActivity[] = [
  {
    id: '1',
    device: 'iPhone 14 Pro',
    location: 'New York, USA',
    ipAddress: '192.168.1.1',
    timestamp: '2025-01-15 10:30 AM',
    isCurrent: true,
  },
  {
    id: '2',
    device: 'Samsung Galaxy S23',
    location: 'Los Angeles, USA',
    ipAddress: '192.168.1.2',
    timestamp: '2025-01-14 08:15 AM',
    isCurrent: false,
  },
  {
    id: '3',
    device: 'MacBook Pro',
    location: 'San Francisco, USA',
    ipAddress: '192.168.1.3',
    timestamp: '2025-01-13 02:45 PM',
    isCurrent: false,
  },
  {
    id: '4',
    device: 'iPad Air',
    location: 'Chicago, USA',
    ipAddress: '192.168.1.4',
    timestamp: '2025-01-12 11:20 AM',
    isCurrent: false,
  },
];

export default function LoginActivityScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activities] = useState<LoginActivity[]>(mockLoginActivities);

  const handleSignOutAll = () => {
    // TODO: Implement sign out all devices
    Alert.alert('Info', 'Sign out all devices functionality will be implemented');
  };

  const handleSignOutDevice = (id: string) => {
    // TODO: Implement sign out specific device
    Alert.alert('Info', `Sign out device ${id} functionality will be implemented`);
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('ipad')) {
      return 'phone-portrait-outline';
    }
    if (device.toLowerCase().includes('macbook') || device.toLowerCase().includes('mac')) {
      return 'laptop-outline';
    }
    if (device.toLowerCase().includes('samsung') || device.toLowerCase().includes('android')) {
      return 'phone-portrait-outline';
    }
    return 'device-desktop-outline';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.loginActivity')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={24} color="#D4A444" />
          <Text style={styles.infoText}>
            This is a list of devices that have logged into your account. Review this list and sign out any devices you don't recognize.
          </Text>
        </View>

        <View style={styles.activitiesList}>
          {activities.map((activity) => (
            <View key={activity.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityLeft}>
                  <Ionicons 
                    name={getDeviceIcon(activity.device) as any} 
                    size={24} 
                    color="#D4A444" 
                  />
                  <View style={styles.activityInfo}>
                    <View style={styles.deviceRow}>
                      <Text style={styles.deviceName}>{activity.device}</Text>
                      {activity.isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.activityLocation}>{activity.location}</Text>
                    <Text style={styles.activityDetails}>
                      {activity.ipAddress} • {activity.timestamp}
                    </Text>
                  </View>
                </View>
                {!activity.isCurrent && (
                  <TouchableOpacity
                    onPress={() => handleSignOutDevice(activity.id)}
                    style={styles.signOutButton}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.signOutAllButton}
          onPress={handleSignOutAll}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.signOutAllText}>Sign Out All Other Devices</Text>
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
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  activitiesList: {
    gap: 12,
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  activityInfo: {
    flex: 1,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  currentBadge: {
    backgroundColor: '#D4A444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  signOutButton: {
    padding: 8,
  },
  signOutAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
  },
  signOutAllText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});


import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BottomNav } from '../components/BottomNav';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

interface UserProfile {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  imageUrl?: string;
  iban?: string;
  stats?: {
    eventsAttended?: number;
    following?: number;
    followers?: number;
  };
}

export default function ProfileScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasShownAlert = useRef(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await storageService.getToken();
      if (!token) {
        setError('Please login to view profile');
        setLoading(false);
        return;
      }

      const response = await apiService.get<{
        success?: boolean;
        data?: UserProfile;
        _id?: string;
        id?: string;
        name?: string;
        email?: string;
        phone?: string;
        bio?: string;
        avatar?: string;
        imageUrl?: string;
        iban?: string;
      }>('/users/profile');

      // Handle different response formats
      const userData = response.data || response;
      setUser(userData as UserProfile);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Show alert and navigate to edit profile when redirected from signup
  useEffect(() => {
    if (params.completeProfile === 'true' && !hasShownAlert.current) {
      hasShownAlert.current = true;
      Alert.alert(
        t('common.success'),
        t('editProfile.completeProfileMessage'),
        [
          { 
            text: 'OK', 
            onPress: () => {
              router.push('/edit-profile');
            }
          }
        ]
      );
      // Clear the query parameter
      router.setParams({ completeProfile: undefined });
    }
  }, [params.completeProfile, t, router]);

  const menuSections = user ? [
    {
      title: t('profile.account'),
      items: [
        { icon: 'person-outline', label: t('profile.editProfile'), action: () => router.push('/edit-profile') },
        { icon: 'heart-outline', label: t('profile.savedEvents'), count: 5, action: () => router.push('/saved-events') },
        { icon: 'calendar-outline', label: t('profile.myEvents'), count: 3, action: () => router.push('/my-events') },
        { icon: 'card-outline', label: t('profile.paymentMethods'), action: () => router.push('/payment-methods') }
      ]
    },
    {
      title: t('profile.preferences'),
      items: [
        { icon: 'notifications-outline', label: t('profile.notifications'), action: () => router.push('/notifications') },
        { icon: 'settings-outline', label: t('profile.settings'), action: () => router.push('/settings') },
        { icon: 'help-circle-outline', label: t('profile.helpSupport'), action: () => router.push('/help-support') }
      ]
    }
  ] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4A444" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchUserProfile}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : user ? (
          <>
            {/* User Info */}
            <View style={styles.userSection}>
              <View style={styles.userInfo}>
                <ImageWithFallback
                  src={user.avatar || user.imageUrl || 'https://via.placeholder.com/80?text=User'}
                  style={styles.avatar}
                />
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{user.name || 'User'}</Text>
                  <Text style={styles.userEmail}>{user.email || ''}</Text>
                </View>
              </View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{user.stats?.eventsAttended || 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.events')}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{user.stats?.following || 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.following')}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{user.stats?.followers || 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {user && (
          <View style={styles.menuContainer}>
            {menuSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon as any} size={20} color="#374151" />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.count !== undefined && (
                      <Text style={styles.menuItemCount}>{item.count}</Text>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            ))}

            {/* Logout */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => router.replace('/login')}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BottomNav activeView="profile" onNavigate={(screen) => {
        if (screen === 'profile') return;
        router.push(`/${screen}`);
      }} />

      <BottomNav activeView="profile" onNavigate={(screen) => {
        if (screen === 'profile') return;
        router.push(`/${screen}`);
      }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  userSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  menuContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#374151',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#D4A444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


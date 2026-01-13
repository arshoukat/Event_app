import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share, Clipboard, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Polyfill for TextEncoder/TextDecoder (required for react-native-qrcode-svg)
import { TextEncoder, TextDecoder } from 'text-encoding';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Helper function to get base share URL
const getShareBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it (remove /api)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const urlMatch = process.env.EXPO_PUBLIC_API_URL.match(/http:\/\/([^:]+):(\d+)/);
    if (urlMatch) {
      const host = urlMatch[1];
      const port = urlMatch[2];
      return `http://${host}:${port}`;
    }
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  
  // For physical devices, try to detect IP
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5002`;
      }
    }
  }
  
  // Default to localhost:5002 (backend port)
  return 'http://localhost:5002';
};

interface Event {
  _id: string;
  title: string;
  shareToken?: string;
  maxAttendees?: number;
}

interface Booking {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  status: string;
}

interface ManagementData {
  event: Event;
  acceptedUsers: Booking[];
  pendingUsers: any[];
  stats: {
    totalAccepted: number;
    totalPending: number;
    maxAttendees: number | null;
    availableSpots: number | null;
  };
}

export default function ManagePrivateEventScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managementData, setManagementData] = useState<ManagementData | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'share' | 'accepted' | 'pending'>('share');
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (id) {
      fetchManagementData();
      fetchShareLink();
    }
  }, [id]);

  const fetchManagementData = async () => {
    try {
      setLoading(true);
      setError(null);

      const eventId = Array.isArray(id) ? String(id[0]) : String(id);
      
      // Fetch management data
      const response = await apiService.get<{ success: boolean; data: ManagementData } | ManagementData | { data: ManagementData }>(`/events/${eventId}/manage`);
      
      let data: ManagementData;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        data = (response as { success: boolean; data: ManagementData }).data;
      } else if (response && typeof response === 'object' && 'data' in response) {
        data = (response as { data: ManagementData }).data;
      } else {
        data = response as ManagementData;
      }

      setManagementData(data);
    } catch (err: any) {
      console.error('Failed to fetch management data:', err);
      if (err.status === 403) {
        setError('You do not have permission to manage this event');
      } else {
        setError(err?.message || 'Failed to load management data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShareLink = async () => {
    try {
      const eventId = Array.isArray(id) ? String(id[0]) : String(id);
      
      // Fetch share link
      const response = await apiService.get<{ success: boolean; data: { shareToken: string; shareUrl: string } } | { shareToken: string; shareUrl: string }>(`/events/${eventId}/share-link`);
      
      let linkData: { shareToken: string; shareUrl: string };
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        linkData = (response as { success: boolean; data: { shareToken: string; shareUrl: string } }).data;
      } else {
        linkData = response as { shareToken: string; shareUrl: string };
      }

      const baseShareUrl = getShareBaseUrl();
      setShareLink(linkData.shareUrl || `${baseShareUrl}/share/${linkData.shareToken}`);
    } catch (err: any) {
      console.error('Failed to fetch share link:', err);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      Clipboard.setString(shareLink);
      Alert.alert('Success', 'Share link copied to clipboard');
    }
  };

  const handleShareEmail = async () => {
    if (!shareLink || !managementData) return;

    try {
      const subject = `Invitation to ${managementData.event.title}`;
      const body = `You're invited to join my private event: ${managementData.event.title}\n\nJoin here: ${shareLink}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        // Fallback to native share if email app is not available
        await Share.share({
          message: body,
          subject: subject,
        });
      }
    } catch (err) {
      console.error('Failed to share via email:', err);
      // Fallback to native share on error
      try {
        const subject = `Invitation to ${managementData.event.title}`;
        const body = `You're invited to join my private event: ${managementData.event.title}\n\nJoin here: ${shareLink}`;
        await Share.share({
          message: body,
          subject: subject,
        });
      } catch (shareErr) {
        Alert.alert('Error', 'Unable to share. Please copy the link manually.');
      }
    }
  };

  const handleShareNative = async () => {
    if (!shareLink || !managementData) return;

    try {
      await Share.share({
        message: `Join my private event: ${managementData.event.title}\n\n${shareLink}`,
        url: shareLink,
      });
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Event</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A444" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !managementData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Event</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Failed to load management data'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchManagementData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Event</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{managementData.stats.totalAccepted}</Text>
            <Text style={styles.statLabel}>Accepted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{managementData.stats.totalPending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          {managementData.stats.maxAttendees && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {managementData.stats.availableSpots !== null ? managementData.stats.availableSpots : '∞'}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'share' && styles.tabActive]}
            onPress={() => setActiveTab('share')}
          >
            <Ionicons 
              name="share-outline" 
              size={20} 
              color={activeTab === 'share' ? '#D4A444' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'share' && styles.tabTextActive]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'accepted' && styles.tabActive]}
            onPress={() => setActiveTab('accepted')}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color={activeTab === 'accepted' ? '#D4A444' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'accepted' && styles.tabTextActive]}>Accepted</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={activeTab === 'pending' ? '#D4A444' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'share' && (
          <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Share Event</Text>
            
            {/* Share Link */}
            <View style={styles.shareLinkContainer}>
              <Text style={styles.shareLinkLabel}>Share Link</Text>
              <View style={styles.shareLinkRow}>
                <Text style={styles.shareLink} numberOfLines={2}>
                  {shareLink || 'Loading...'}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopyLink}
                >
                  <Ionicons name="copy-outline" size={20} color="#D4A444" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Share Buttons */}
            <View style={styles.shareButtonsContainer}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareEmail}
              >
                <Ionicons name="mail-outline" size={24} color="#D4A444" />
                <Text style={styles.shareButtonText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareNative}
              >
                <Ionicons name="share-outline" size={24} color="#D4A444" />
                <Text style={styles.shareButtonText}>More</Text>
              </TouchableOpacity>
            </View>

            {/* QR Code Button */}
            <TouchableOpacity
              style={styles.qrCodeButton}
              onPress={() => setShowQRCode(true)}
            >
              <Ionicons name="qr-code-outline" size={24} color="#D4A444" />
              <Text style={styles.qrCodeButtonText}>Generate QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'accepted' && (
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>Accepted Users ({managementData.acceptedUsers.length})</Text>
            {managementData.acceptedUsers.length > 0 ? (
              managementData.acceptedUsers.map((booking) => (
                <View key={booking._id} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {booking.userId?.name?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{booking.userId?.name || 'Unknown User'}</Text>
                      <Text style={styles.userEmail}>{booking.userId?.email || ''}</Text>
                      <Text style={styles.userDate}>
                        Confirmed on {new Date(booking.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userStatus}>
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No accepted users yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'pending' && (
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>Pending Users ({managementData.pendingUsers.length})</Text>
            {managementData.pendingUsers.length > 0 ? (
              managementData.pendingUsers.map((invitation: any, index: number) => (
                <View key={invitation._id || index} style={styles.userCard}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>P</Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{invitation.email || invitation.userId?.email || 'Pending'}</Text>
                      <Text style={styles.userDate}>
                        Invited on {new Date(invitation.createdAt || Date.now()).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userStatus}>
                    <Ionicons name="time" size={24} color="#f59e0b" />
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="hourglass-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No pending invitations</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      {showQRCode && shareLink && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRCode(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={shareLink}
                size={250}
                color="#000"
                backgroundColor="#fff"
              />
            </View>
            <Text style={styles.qrCodeHint}>Scan to join the event</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQRCode(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#D4A444',
    fontWeight: '600',
  },
  shareSection: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  shareLinkContainer: {
    gap: 8,
  },
  shareLinkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  shareLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  shareLink: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  copyButton: {
    padding: 4,
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  qrCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#D4A444',
  },
  qrCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A444',
  },
  usersSection: {
    gap: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D4A444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  userDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  userStatus: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrCodeHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  modalCloseButton: {
    backgroundColor: '#D4A444',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


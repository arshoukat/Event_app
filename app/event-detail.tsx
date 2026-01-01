import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper function to get base URL for images (API URL without /api)
const getImageBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  
  // For physical devices, try to detect IP
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5001`;
      }
    }
  }
  
  // Default to localhost
  return 'http://localhost:5001';
};

interface ApiEvent {
  _id?: string; // MongoDB ID
  id?: string | number; // Fallback for other formats
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  venue?: string;
  category: string;
  price: Array<{ name: string; price: number; _id?: string }> | number | string;
  imageUrl?: string | null;
  tags?: string[];
  attendees?: number | string[]; // Can be number or array
  capacity?: number;
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  organizer?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  visibility?: string;
  invitedEmails?: string[];
  licenseFile?: string | null;
  iban?: string;
  status?: string;
}

interface DisplayEvent {
  id: string | number; // Keep as string for MongoDB ObjectIds
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress: string;
  category: string;
  image: string;
  attendees: number;
  price: number | string;
  tags: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
    followers?: string;
  };
}

export default function EventDetailScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[EventDetail] useEffect triggered, id:', id);
    if (id) {
      fetchEventDetails();
    } else {
      console.warn('[EventDetail] No ID provided in URL params');
      setError('Event ID is missing');
      setLoading(false);
    }
  }, [id]);

  const fetchEventDetails = async () => {
    console.log('[EventDetail] fetchEventDetails called');
    console.log('[EventDetail] Raw id from params:', id);
    console.log('[EventDetail] id type:', typeof id);
    console.log('[EventDetail] id is array:', Array.isArray(id));
    
    // Validate ID - check if it exists and is not "undefined"
    if (!id || id === 'undefined' || id === 'null' || id === 'unknown') {
      console.error('[EventDetail] Invalid ID:', id);
      setError('Event ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract and validate event ID from URL parameters
      // useLocalSearchParams automatically decodes URL-encoded values
      let eventId: string;
      if (Array.isArray(id)) {
        eventId = String(id[0]); // Get first element if array
        console.log('[EventDetail] ID was array, extracted:', eventId);
      } else {
        eventId = String(id);
        console.log('[EventDetail] ID was string, using:', eventId);
      }

      // Additional validation - ensure it's a valid ID
      if (!eventId || eventId === 'undefined' || eventId === 'null' || eventId === 'unknown' || eventId === '') {
        console.error('[EventDetail] Invalid event ID after processing:', eventId);
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      console.log('[EventDetail] Fetching event details for ID:', eventId);
      console.log('[EventDetail] API endpoint will be: /events/' + eventId);

      // Fetch event from API - the ID is appended to the URL
      const response = await apiService.get<{ success: boolean; data: ApiEvent } | ApiEvent | { data: ApiEvent }>(`/events/${eventId}`);
      
      console.log('[EventDetail] Event details response received:', response);
      console.log('[EventDetail] Response type:', typeof response);
      console.log('[EventDetail] Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle different response formats
      let eventData: ApiEvent;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Backend format: { success: true, data: {...} }
        eventData = (response as { success: boolean; data: ApiEvent }).data;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Alternative format: { data: {...} }
        eventData = (response as { data: ApiEvent }).data;
      } else if (Array.isArray(response)) {
        eventData = response[0];
      } else {
        eventData = response as ApiEvent;
      }
      
      // Use _id if id is not present (MongoDB format)
      if (!eventData.id && eventData._id) {
        eventData.id = eventData._id;
      }
      
      // Map createdBy to organizer if organizer is not present
      if (!eventData.organizer && eventData.createdBy) {
        eventData.organizer = {
          name: eventData.createdBy.name,
          email: eventData.createdBy.email,
          avatar: eventData.createdBy.avatar
        };
      }

      // Format date
      const eventDate = new Date(eventData.startTime || eventData.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Format time
      const startTime = new Date(eventData.startTime || eventData.date);
      const formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      let formattedEndTime = '';
      if (eventData.endTime) {
        const endTime = new Date(eventData.endTime);
        formattedEndTime = endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      const formattedTime = formattedEndTime 
        ? `${formattedStartTime} - ${formattedEndTime}`
        : formattedStartTime;

      // Format price
      let priceDisplay: number | string = 'Free';
      if (Array.isArray(eventData.price) && eventData.price.length > 0) {
        // If price is an array of seat types, show the minimum price
        const minPrice = Math.min(...eventData.price.map(p => p.price));
        priceDisplay = minPrice;
      } else if (typeof eventData.price === 'number') {
        priceDisplay = eventData.price;
      } else if (typeof eventData.price === 'string' && eventData.price !== 'Free') {
        priceDisplay = eventData.price;
      }

      // Get image URL - handle relative paths
      let imageUrl = '';
      if (eventData.imageUrl) {
        if (eventData.imageUrl.startsWith('data:image')) {
          // Base64 image
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('http://') || eventData.imageUrl.startsWith('https://')) {
          // Full URL
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('/')) {
          // Relative path - prepend base URL (without /api)
          const baseUrl = getImageBaseUrl();
          imageUrl = `${baseUrl}${eventData.imageUrl}`;
          console.log('Constructed image URL:', imageUrl);
        } else {
          imageUrl = eventData.imageUrl;
        }
      }

      // Handle attendees - can be number or array
      let attendeesCount = 0;
      if (typeof eventData.attendees === 'number') {
        attendeesCount = eventData.attendees;
      } else if (Array.isArray(eventData.attendees)) {
        attendeesCount = eventData.attendees.length;
      }

      // Transform to display format
      // Keep ID as string for MongoDB ObjectIds - do NOT convert to number
      const transformedEvent: DisplayEvent = {
        id: eventData.id ? String(eventData.id) : (eventData._id ? String(eventData._id) : ''),
        title: eventData.title,
        date: formattedDate,
        time: formattedTime,
        location: eventData.venue || eventData.location,
        fullAddress: eventData.location || eventData.venue || '',
        category: eventData.category,
        image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
        attendees: attendeesCount,
        price: priceDisplay,
        tags: eventData.tags || [],
        description: eventData.description || 'No description available.',
        host: {
          name: eventData.organizer?.name || eventData.createdBy?.name || 'Event Organizer',
          avatar: eventData.organizer?.avatar || eventData.createdBy?.avatar || 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NjUzMDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
          followers: '0'
        }
      };

      setEvent(transformedEvent);
    } catch (err: any) {
      console.error('[EventDetail] Failed to fetch event details:', err);
      console.error('[EventDetail] Error type:', typeof err);
      console.error('[EventDetail] Error message:', err?.message);
      console.error('[EventDetail] Error stack:', err?.stack);
      
      const errorMessage = err?.message || err?.toString() || 'Failed to load event details. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A444" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <ImageWithFallback
            src={event.image}
            style={styles.image}
          />
          <View style={styles.imageOverlay} />
          
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags */}
          <View style={styles.tagsContainer}>
            {event.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Host Info */}
          <View style={styles.hostContainer}>
            <ImageWithFallback
              src={event.host.avatar}
              style={styles.hostAvatar}
            />
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.host.name}</Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.date')}</Text>
                <Text style={styles.detailValue}>{event.date}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.time')}</Text>
                <Text style={styles.detailValue}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.location')}</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
                <Text style={styles.detailSubValue}>{event.fullAddress}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="people-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.attendees')}</Text>
                <Text style={styles.detailValue}>{event.attendees} attending</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{t('event.about')}</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            {typeof event.price === 'number' ? `$${event.price}` : event.price}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push(`/ticket-booking?id=${encodeURIComponent(String(event.id))}`)}
        >
          <Text style={styles.bookButtonText}>{t('event.bookTicket')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D4A444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D4A444',
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  bookButton: {
    flex: 2,
    backgroundColor: '#D4A444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


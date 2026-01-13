import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

interface SavedEvent {
  _id: string;
  eventId: string | {
    _id: string;
    title: string;
    startTime: string;
    endTime?: string;
    date?: string;
    location: string;
    venue?: string;
    imageUrl?: string;
    price: Array<{ name: string; price: number }> | number | string;
    category: string;
    visibility?: 'public' | 'private';
  };
  userId: string;
  createdAt: string;
}

interface DisplayEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  attendees: number;
  price: string;
  visibility?: 'public' | 'private';
}

// Helper function to get base URL for images
const getImageBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  return 'http://localhost:5001';
};

export default function SavedEventsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [savedEvents, setSavedEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedEvents();
  }, []);

  const fetchSavedEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const token = await storageService.getToken();
      if (!token) {
        setError('Please login to view saved events');
        setLoading(false);
        return;
      }

      const user = await storageService.getUser();
      if (!user || !user._id) {
        setError('User information not found. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch saved events from API
      const response = await apiService.get<{ 
        success: boolean; 
        data: SavedEvent[] 
      } | { 
        data: SavedEvent[] 
      } | SavedEvent[]>(`/saved-events?userId=${encodeURIComponent(user._id)}`);

      console.log('[SavedEvents] API response:', response);

      // Extract saved events array from response
      let savedEventsArray: SavedEvent[] = [];
      if (Array.isArray(response)) {
        savedEventsArray = response;
      } else if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && Array.isArray(response.data)) {
          savedEventsArray = response.data;
        } else if ('data' in response && Array.isArray((response as { data: SavedEvent[] }).data)) {
          savedEventsArray = (response as { data: SavedEvent[] }).data;
        }
      }

      console.log('[SavedEvents] Extracted saved events count:', savedEventsArray.length);

      // Transform saved events to display format
      const transformedEvents: (DisplayEvent | null)[] = savedEventsArray.map((savedEvent) => {
        // Handle populated event or eventId string
        const event = typeof savedEvent.eventId === 'object' ? savedEvent.eventId : null;
        const eventId = typeof savedEvent.eventId === 'string' 
          ? savedEvent.eventId 
          : (event?._id || String(savedEvent.eventId));

        if (!event) {
          // If event is not populated, log warning and skip
          console.warn('[SavedEvents] Event not populated in saved event:', savedEvent._id);
          return null;
        }

        // Parse event dates
        const eventStartDate = new Date(event.startTime || event.date || '');
        
        // Format date
        const formattedDate = eventStartDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        // Format time
        const formattedTime = eventStartDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Format price
        let priceString = 'Free';
        if (Array.isArray(event.price) && event.price.length > 0) {
          const minPrice = Math.min(...event.price.map(p => p.price));
          priceString = `$${minPrice}`;
        } else if (typeof event.price === 'number') {
          priceString = `$${event.price}`;
        } else if (typeof event.price === 'string' && event.price !== 'Free') {
          priceString = event.price;
        }

        // Get image URL
        let imageUrl = '';
        if (event.imageUrl) {
          if (event.imageUrl.startsWith('data:image') || 
              event.imageUrl.startsWith('http://') || 
              event.imageUrl.startsWith('https://')) {
            imageUrl = event.imageUrl;
          } else if (event.imageUrl.startsWith('/')) {
            const baseUrl = getImageBaseUrl();
            imageUrl = `${baseUrl}${event.imageUrl}`;
          } else {
            imageUrl = event.imageUrl;
          }
        }

        return {
          id: String(eventId),
          title: event.title,
          date: formattedDate,
          time: formattedTime,
          location: event.venue || event.location,
          category: event.category,
          image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
          attendees: 0, // Can be added if needed
          price: priceString,
          visibility: event.visibility,
        };
      });

      // Filter out null values
      const validEvents: DisplayEvent[] = transformedEvents.filter(
        (event): event is DisplayEvent => event !== null
      );

      console.log('[SavedEvents] Transformed events count:', validEvents.length);
      setSavedEvents(validEvents);
    } catch (err: any) {
      console.error('[SavedEvents] Failed to fetch saved events:', err);
      if (err.status === 401) {
        setError('Please login to view saved events');
        Alert.alert('Session Expired', 'Please login again to view your saved events.', [
          { text: 'OK', onPress: () => router.push('/login') }
        ]);
      } else {
        setError(err?.message || 'Failed to load saved events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewEvent = (eventId: number | string, visibility?: 'public' | 'private') => {
    // Check if event is private
    if (visibility === 'private') {
      Alert.alert(
        'Private Event',
        'This is a private event',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push(`/event-detail?id=${encodeURIComponent(String(eventId))}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('savedEvents.title')}</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4A444" />
            <Text style={styles.loadingText}>Loading saved events...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={styles.emptyTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchSavedEvents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : savedEvents.length > 0 ? (
          savedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={handleViewEvent}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>{t('savedEvents.noSaved')}</Text>
            <Text style={styles.emptyText}>{t('savedEvents.saveEvents')}</Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    minHeight: 400,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#D4A444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

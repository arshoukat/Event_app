import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard';
import { apiService } from '../services/api';

interface ApiEvent {
  _id?: string;
  id?: string | number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  location: string;
  venue?: string;
  category: string;
  price: Array<{ name: string; price: number; _id?: string }> | number | string;
  imageUrl?: string | null;
  tags?: string[];
  attendees?: number | string[];
  capacity?: number;
  visibility?: 'public' | 'private';
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface DisplayEvent {
  id: number | string;
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

export default function MyEventsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'past'>('upcoming');
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events when component mounts or tab changes
  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine endpoint based on active tab
      const endpoint = `/events/my/${activeTab}`;
      
      console.log('[MyEvents] Fetching events from:', endpoint);
      
      // Fetch events from API
      const response = await apiService.get<{ success: boolean; data: ApiEvent[]; count: number; message: string }>(endpoint);
      
      console.log('[MyEvents] API response:', response);
      
      // Extract events array from response
      let eventsArray: ApiEvent[] = [];
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && Array.isArray(response.data)) {
          eventsArray = response.data;
        } else if ('data' in response && Array.isArray((response as { data: ApiEvent[] }).data)) {
          eventsArray = (response as { data: ApiEvent[] }).data;
        }
      }
      
      console.log('[MyEvents] Extracted events array, count:', eventsArray.length);
      
      // Transform API events to display format
      const transformedEvents: DisplayEvent[] = eventsArray.map((event) => {
        // Extract ID
        const eventId = event._id ? String(event._id) : (event.id ? String(event.id) : '');
        
        // Format date from startDate (ISO datetime string)
        const eventDate = new Date(event.startDate);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        // Format time from startDate
        const formattedTime = eventDate.toLocaleTimeString('en-US', {
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

        // Get image URL - handle relative paths
        let imageUrl = '';
        if (event.imageUrl) {
          if (event.imageUrl.startsWith('data:image')) {
            // Base64 image
            imageUrl = event.imageUrl;
          } else if (event.imageUrl.startsWith('http://') || event.imageUrl.startsWith('https://')) {
            // Full URL
            imageUrl = event.imageUrl;
          } else if (event.imageUrl.startsWith('/')) {
            // Relative path - prepend base URL (without /api)
            const baseUrl = process.env.EXPO_PUBLIC_API_URL 
              ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '')
              : 'http://localhost:5001';
            imageUrl = `${baseUrl}${event.imageUrl}`;
          } else {
            imageUrl = event.imageUrl;
          }
        }

        // Get attendees count
        let attendeesCount = 0;
        if (typeof event.attendees === 'number') {
          attendeesCount = event.attendees;
        } else if (Array.isArray(event.attendees)) {
          attendeesCount = event.attendees.length;
        }

        return {
          id: eventId,
          title: event.title,
          date: formattedDate,
          time: formattedTime,
          location: event.venue || event.location,
          category: event.category,
          image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
          attendees: attendeesCount,
          price: priceString,
          visibility: event.visibility
        };
      }).filter((event) => event.id !== ''); // Filter out events without IDs

      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('[MyEvents] Failed to fetch events:', err);
      setError(err.message || 'Failed to load events. Please try again.');
      
      // Handle unauthorized - redirect to login
      if (err.status === 401) {
        Alert.alert('Session Expired', 'Please login again to view your events.', [
          { text: 'OK', onPress: () => router.push('/login') }
        ]);
      } else {
        Alert.alert('Error', err.message || 'Failed to load events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('myEvents.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ongoing' && styles.tabActive]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.tabTextActive]}>
            {t('On Going')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('myEvents.past')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#D4A444" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={styles.emptyTitle}>Error Loading Events</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchEvents}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : events.length > 0 ? (
          events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={(id, visibility) => {
                // Check if event is private
                if (visibility === 'private') {
                  Alert.alert(
                    'Private Event',
                    'This is a private event',
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Return to home screen (stay on current screen)
                        }
                      }
                    ]
                  );
                  return; // Prevent navigation
                }
                // Navigate to event detail for public events
                router.push(`/event-detail?id=${id}`);
              }}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' 
                ? t('myEvents.noUpcoming') 
                : activeTab === 'ongoing'
                ? (t('No ongoing events') || 'No ongoing events')
                : t('myEvents.noPast')}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' 
                ? t('myEvents.bookTickets') 
                : activeTab === 'ongoing'
                ? (t('You have no events happening right now') || 'You have no events happening right now')
                : t('myEvents.attendedEvents')}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav activeView="my-events" onNavigate={(screen) => {
        if (screen === 'my-events') return;
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#D4A444',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#D4A444',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
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
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
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
    fontSize: 14,
    fontWeight: '600',
  },
});

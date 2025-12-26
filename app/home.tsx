import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EventCard } from '../components/EventCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { apiService } from '../services/api';
import Toast from 'react-native-toast-message';

interface ApiEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  venue?: string;
  category: string;
  price: Array<{ name: string; price: number }> | number | string;
  imageUrl?: string | null;
  tags?: string[];
  attendees?: number;
  capacity?: number;
}

interface DisplayEvent {
  id: number | string; // Can be number for display or string (MongoDB ObjectId) for API
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  attendees: number;
  price: string;
}

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasShownToast = useRef(false);

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  // Refetch events when event is created
  useEffect(() => {
    if (params.eventCreated === 'true') {
      fetchEvents();
    }
  }, [params.eventCreated]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch events from API
      const response = await apiService.get<ApiEvent[] | { data: ApiEvent[] }>('/events');
      
      // Handle different response formats (array or wrapped in data property)
      let eventsArray: ApiEvent[] = [];
      if (Array.isArray(response)) {
        eventsArray = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        eventsArray = response.data;
      }
      
      // Transform API events to display format
      const transformedEvents: DisplayEvent[] = eventsArray.map((event) => {
        // Format date
        const eventDate = new Date(event.startTime || event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        // Format time
        const formattedTime = eventDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Format price
        let priceString = 'Free';
        if (Array.isArray(event.price) && event.price.length > 0) {
          // If price is an array of seat types, show the minimum price
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
          // If it's a base64 string, use it directly
          if (event.imageUrl.startsWith('data:image')) {
            imageUrl = event.imageUrl;
          } else {
            // Otherwise, treat it as a URL
            imageUrl = event.imageUrl;
          }
        }

        // Ensure ID is properly extracted - MongoDB ObjectIds are strings
        const eventId = event.id ? String(event.id) : null;
        if (!eventId) {
          console.warn('Event missing ID:', event);
        }

        return {
          // Keep original ID as string (MongoDB ObjectId) for API calls
          id: eventId || 'unknown', // Ensure ID is always a string
          title: event.title,
          date: formattedDate,
          time: formattedTime,
          location: event.venue || event.location,
          category: event.category,
          image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
          attendees: event.attendees || 0,
          price: priceString,
        };
      });

      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load events',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Show success pop-up when event is created
  useEffect(() => {
    if (params.eventCreated === 'true' && !hasShownToast.current) {
      hasShownToast.current = true;
      
      // Show toast message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Event has been created',
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
      });

      // Clear the query parameter from URL
      router.setParams({ eventCreated: undefined });
    }
  }, [params.eventCreated, router]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  // Filter events by category
  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  const handleViewEvent = (eventId: number | string) => {
    // Ensure eventId is valid before navigating
    if (eventId === undefined || eventId === null || eventId === 'undefined' || eventId === 'null' || eventId === '' || eventId === 'unknown') {
      console.error('Invalid event ID:', eventId);
      Alert.alert('Error', 'Invalid event ID. Please try again.');
      return;
    }
    // Convert to string for URL parameter - ensure it's properly encoded
    const idString = String(eventId).trim();
    console.log('Navigating to event detail with ID:', idString);
    // Use encodeURIComponent to properly encode the ID in the URL
    router.push(`/event-detail?id=${encodeURIComponent(idString)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A444"
            colors={['#D4A444']}
          />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{t('home.discoverEvents')}</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-event')}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.createButtonText}>{t('home.createEvent')}</Text>
          </TouchableOpacity>
        </View>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <View style={styles.eventsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#D4A444" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchEvents}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <EventCard 
                key={`event-${event.id}-${index}`} 
                event={event}
                onViewDetails={handleViewEvent}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No events found in this category</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav activeView="home" onNavigate={(screen) => {
        if (screen === 'home') return;
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D4A444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsList: {
    marginTop: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
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


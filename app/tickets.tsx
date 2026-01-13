import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';

// Interface for Booking from API
interface Booking {
  _id: string;
  eventId: string | {
    _id: string;
    title: string;
    date?: string;
    startTime: string;
    endTime?: string;
    location: string;
    venue?: string;
    imageUrl?: string;
    price: Array<{ name: string; price: number; _id?: string }> | number | string;
  };
  userId: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  ticketType?: string;
  quantity: number;
  price: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// Interface for transformed Ticket
interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImage: string;
  ticketType: string;
  quantity: number;
  price: number;
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  eventDateTime: Date; // For sorting
  qrCode?: string;
}

// Helper function to get base URL for images
const getImageBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  return 'http://localhost:5001';
};

// Helper function to determine if event is ongoing
const isEventOngoing = (startTime: Date, endTime?: Date): boolean => {
  const now = new Date();
  if (!endTime) {
    // If no end time, event is ongoing if it started and hasn't passed start time + 4 hours
    const estimatedEnd = new Date(startTime.getTime() + 4 * 60 * 60 * 1000);
    return now >= startTime && now <= estimatedEnd;
  }
  return now >= startTime && now <= endTime;
};

export default function TicketsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [showPastTickets, setShowPastTickets] = useState(false);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterAndSortTickets();
  }, [showPastTickets, allTickets]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const token = await storageService.getToken();
      if (!token) {
        setError('Please login to view your tickets');
        setLoading(false);
        return;
      }

      // Get user ID from storage
      const user = await storageService.getUser();
      if (!user || (!user._id && !user.id)) {
        setError('User information not found. Please login again.');
        setLoading(false);
        router.push('/login');
        return;
      }

      const userId = user._id || user.id;
      
      // Fetch user bookings from API with userId as query parameter
      const response = await apiService.get<{ 
        success: boolean; 
        data: Booking[] 
      } | { 
        data: Booking[] 
      } | Booking[]>(`/bookings?userId=${encodeURIComponent(String(userId))}`);

      console.log('[Tickets] API response:', response);

      // Extract bookings array from response
      let bookingsArray: Booking[] = [];
      if (Array.isArray(response)) {
        bookingsArray = response;
      } else if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response && Array.isArray(response.data)) {
          bookingsArray = response.data;
        } else if ('data' in response && Array.isArray((response as { data: Booking[] }).data)) {
          bookingsArray = (response as { data: Booking[] }).data;
        }
      }

      console.log('[Tickets] Extracted bookings count:', bookingsArray.length);

      // Transform bookings to tickets
      const transformedTickets: (Ticket | null)[] = bookingsArray
        .filter(booking => booking.status !== 'cancelled') // Exclude cancelled
        .map((booking) => {
          // Handle populated event or eventId string
          const event = typeof booking.eventId === 'object' ? booking.eventId : null;
          const eventId = typeof booking.eventId === 'string' 
            ? booking.eventId 
            : (event?._id || String(booking.eventId));

          if (!event) {
            // If event is not populated, log warning and skip
            console.warn('[Tickets] Event not populated in booking:', booking._id);
            return null;
          }

          // Parse event dates
          const eventStartDate = new Date(event.startTime || event.date || '');
          const eventEndDate = event.endTime ? new Date(event.endTime) : undefined;

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

          // Determine ticket status
          const now = new Date();
          let ticketStatus: 'upcoming' | 'ongoing' | 'past';
          
          if (isEventOngoing(eventStartDate, eventEndDate)) {
            ticketStatus = 'ongoing';
          } else if (eventStartDate > now) {
            ticketStatus = 'upcoming';
          } else {
            ticketStatus = 'past';
          }

          return {
            id: booking._id,
            eventId: String(eventId),
            eventTitle: event.title,
            eventDate: formattedDate,
            eventTime: formattedTime,
            eventLocation: event.venue || event.location,
            eventImage: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
            ticketType: booking.ticketType || 'General Admission',
            quantity: booking.quantity,
            price: booking.price || booking.totalAmount || 0,
            status: ticketStatus,
            eventDateTime: eventStartDate, // For sorting
          };
        });

      // Filter out null values
      const validTickets: Ticket[] = transformedTickets.filter(
        (ticket): ticket is Ticket => ticket !== null
      );

      console.log('[Tickets] Transformed tickets count:', validTickets.length);
      setAllTickets(validTickets);
    } catch (err: any) {
      console.error('[Tickets] Failed to fetch bookings:', err);
      if (err.status === 401) {
        setError('Please login to view your tickets');
        Alert.alert('Session Expired', 'Please login again to view your tickets.', [
          { text: 'OK', onPress: () => router.push('/login') }
        ]);
      } else {
        setError(err?.message || 'Failed to load tickets. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTickets = () => {
    let filtered: Ticket[];

    if (showPastTickets) {
      // Show only past tickets
      filtered = allTickets.filter(ticket => ticket.status === 'past');
      // Sort past tickets by date (most recent first)
      filtered.sort((a, b) => b.eventDateTime.getTime() - a.eventDateTime.getTime());
    } else {
      // Show upcoming and ongoing tickets
      filtered = allTickets.filter(ticket => 
        ticket.status === 'upcoming' || ticket.status === 'ongoing'
      );
      
      // Sort: ongoing first, then by date (nearest first)
      filtered.sort((a, b) => {
        // Prioritize ongoing events
        if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
        if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
        
        // Both ongoing or both upcoming - sort by date (nearest first)
        return a.eventDateTime.getTime() - b.eventDateTime.getTime();
      });
    }

    setFilteredTickets(filtered);
  };

  const renderTicket = (ticket: Ticket) => (
    <TouchableOpacity
      key={ticket.id}
      style={styles.ticketCard}
      onPress={() => router.push(`/event-detail?id=${encodeURIComponent(ticket.eventId)}`)}
    >
      {ticket.status === 'ongoing' && (
        <View style={styles.ongoingBadge}>
          <Ionicons name="radio-button-on" size={12} color="#10b981" />
          <Text style={styles.ongoingBadgeText}>Ongoing</Text>
        </View>
      )}
      <ImageWithFallback
        src={ticket.eventImage}
        style={styles.ticketImage}
      />
      <View style={styles.ticketContent}>
        <Text style={styles.ticketTitle}>{ticket.eventTitle}</Text>
        <View style={styles.ticketDetails}>
          <View style={styles.ticketDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.ticketDetailText}>{ticket.eventDate}</Text>
          </View>
          <View style={styles.ticketDetailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.ticketDetailText}>{ticket.eventTime}</Text>
          </View>
          <View style={styles.ticketDetailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.ticketDetailText}>{ticket.eventLocation}</Text>
          </View>
        </View>
        <View style={styles.ticketFooter}>
          <View>
            <Text style={styles.ticketType}>{ticket.ticketType}</Text>
            <Text style={styles.ticketQuantity}>Qty: {ticket.quantity}</Text>
          </View>
          <View style={styles.ticketPriceContainer}>
            <Text style={styles.ticketPrice}>
              {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      
      {/* Custom Header with Toggle Button */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPastTickets(!showPastTickets)}
        >
          <Text style={styles.toggleButtonText}>
            {showPastTickets ? 'Show Upcoming' : 'Show Past Tickets'}
          </Text>
          <Ionicons 
            name={showPastTickets ? "arrow-up" : "arrow-down"} 
            size={16} 
            color="#D4A444" 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          undefined // You can add RefreshControl here if needed
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4A444" />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text style={styles.emptyTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchBookings}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map(renderTicket)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {showPastTickets ? 'No Past Tickets' : 'No Upcoming Tickets'}
            </Text>
            <Text style={styles.emptyText}>
              {showPastTickets 
                ? 'You haven\'t attended any events yet' 
                : 'Book tickets to events you want to attend'}
            </Text>
          </View>
        )}
      </ScrollView>

      <BottomNav activeView="tickets" onNavigate={(screen) => {
        if (screen === 'tickets') return;
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
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A444',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  ongoingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ongoingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  ticketImage: {
    width: '100%',
    height: 180,
  },
  ticketContent: {
    padding: 16,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  ticketDetails: {
    gap: 8,
    marginBottom: 12,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  ticketQuantity: {
    fontSize: 12,
    color: '#6b7280',
  },
  ticketPriceContainer: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
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

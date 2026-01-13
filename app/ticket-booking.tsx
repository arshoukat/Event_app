import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/api';
import { ImageWithFallback } from '../components/ImageWithFallback';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper function to get base URL for images
const getImageBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5001`;
      }
    }
  }
  
  return 'http://localhost:5001';
};

interface SeatType {
  name: string;
  price: number;
  _id?: string;
}

interface ApiEvent {
  _id?: string;
  id?: string | number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  venue?: string;
  category: string;
  price: SeatType[] | number | string;
  imageUrl?: string | null;
  tags?: string[];
  capacity?: number;
}

interface SelectedTicket {
  seatType: SeatType;
  quantity: number;
}

export default function TicketBookingScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);

  useEffect(() => {
    if (id) {
      fetchEventDetails();
    } else {
      Alert.alert('Error', 'Event ID is missing');
      router.back();
    }
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      // useLocalSearchParams automatically decodes URL-encoded values
      const eventId = Array.isArray(id) ? String(id[0]) : String(id);
      
      console.log('[TicketBooking] Fetching event details for ID:', eventId);
      
      const response = await apiService.get<{ success: boolean; data: ApiEvent } | { data: ApiEvent } | ApiEvent>(`/events/${eventId}`);
      
      let eventData: ApiEvent;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        eventData = (response as { success: boolean; data: ApiEvent }).data;
      } else if (response && typeof response === 'object' && 'data' in response) {
        eventData = (response as { data: ApiEvent }).data;
      } else {
        eventData = response as ApiEvent;
      }

      // Initialize selected tickets based on available seat types
      if (Array.isArray(eventData.price) && eventData.price.length > 0) {
        const initialTickets: SelectedTicket[] = eventData.price.map(seatType => ({
          seatType,
          quantity: 0
        }));
        setSelectedTickets(initialTickets);
      }

      setEvent(eventData);
    } catch (err: any) {
      console.error('[TicketBooking] Failed to fetch event details:', err);
      Alert.alert('Error', 'Failed to load event details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (seatTypeName: string, delta: number) => {
    setSelectedTickets(prev => prev.map(ticket => {
      if (ticket.seatType.name === seatTypeName) {
        const newQuantity = Math.max(0, ticket.quantity + delta);
        return { ...ticket, quantity: newQuantity };
      }
      return ticket;
    }));
  };

  const calculateSubtotal = (): number => {
    return selectedTickets.reduce((sum, ticket) => {
      return sum + (ticket.seatType.price * ticket.quantity);
    }, 0);
  };

  const getTotalQuantity = (): number => {
    return selectedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  };

  // Calculate processing fee and tax based on subtotal using useMemo to avoid infinite loops
  const subtotalForFees = useMemo(() => {
    return selectedTickets.reduce((sum, ticket) => {
      return sum + (ticket.seatType.price * ticket.quantity);
    }, 0);
  }, [selectedTickets]);

  const processingFee = useMemo(() => {
    if (subtotalForFees > 0) {
      return subtotalForFees * 0.025; // 2.5% processing fee
    }
    return 0;
  }, [subtotalForFees]);

  const tax = useMemo(() => {
    if (subtotalForFees > 0) {
      return subtotalForFees * 0.15; // 15% tax (VAT)
    }
    return 0;
  }, [subtotalForFees]);

  const calculateTotal = (): number => {
    const subtotal = calculateSubtotal();
    return subtotal + processingFee + tax;
  };

  const handleProceedToPayment = async () => {
    const totalQty = getTotalQuantity();
    if (totalQty === 0) {
      Alert.alert('Error', 'Please select at least one ticket');
      return;
    }

    // Check capacity before proceeding
    const eventId = Array.isArray(id) ? String(id[0]) : String(id);
    try {
      const response = await apiService.post<{ available: boolean; currentCount: number; maxAttendees: number | null }>(`/events/${eventId}/check-capacity`);
      
      if (response && typeof response === 'object' && 'available' in response) {
        if (!response.available && response.maxAttendees) {
          Alert.alert(
            'Event Full',
            'This event is full. No more seats available.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    } catch (err: any) {
      console.error('Capacity check failed:', err);
      // If capacity check fails, proceed anyway (backend will handle)
    }

    // Calculate values for payment
    const currentSubtotal = calculateSubtotal();
    const currentTotal = currentSubtotal + processingFee + tax;

    // Prepare payment data
    const paymentData = {
      eventId: encodeURIComponent(eventId),
      tickets: encodeURIComponent(JSON.stringify(selectedTickets.filter(t => t.quantity > 0))),
      subtotal: currentSubtotal.toFixed(2),
      processingFee: processingFee.toFixed(2),
      tax: tax.toFixed(2),
      total: currentTotal.toFixed(2),
      totalQuantity: totalQty.toString(),
    };

    // Navigate to payment screen
    router.push(`/payment?${Object.entries(paymentData).map(([k, v]) => `${k}=${v}`).join('&')}`);
  };

  const getImageUrl = (): string => {
    if (!event?.imageUrl) {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }

    if (event.imageUrl.startsWith('data:image')) {
      return event.imageUrl;
    }

    if (event.imageUrl.startsWith('http://') || event.imageUrl.startsWith('https://')) {
      return event.imageUrl;
    }

    if (event.imageUrl.startsWith('/')) {
      const baseUrl = getImageBaseUrl();
      return `${baseUrl}${event.imageUrl}`;
    }

    return event.imageUrl;
  };

  const isFreeEvent = (): boolean => {
    if (!event) return false;
    if (typeof event.price === 'string') return event.price === 'Free';
    if (typeof event.price === 'number') return event.price === 0;
    if (Array.isArray(event.price)) {
      return event.price.length === 0 || event.price.every(p => p.price === 0);
    }
    return false;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('booking.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A444" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('booking.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasSeatTypes = Array.isArray(event.price) && event.price.length > 0;
  const subtotal = calculateSubtotal();
  const total = calculateTotal();
  const totalQuantity = getTotalQuantity();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('booking.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Event Info */}
        <View style={styles.eventInfo}>
          <ImageWithFallback
            src={getImageUrl()}
            style={styles.eventImage}
          />
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
              <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              <Text style={styles.eventDetailText}>
                {new Date(event.startTime || event.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.eventDetailRow}>
              <Ionicons name="location-outline" size={16} color="#6b7280" />
              <Text style={styles.eventDetailText}>{event.venue || event.location}</Text>
            </View>
          </View>
        </View>

        {/* Ticket Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('booking.selectTickets')}</Text>

          {isFreeEvent() ? (
            <View style={styles.freeEventCard}>
              <Text style={styles.freeEventText}>This is a free event</Text>
              <TouchableOpacity
                style={styles.quantityControl}
                onPress={() => handleProceedToPayment()}
              >
                <Text style={styles.quantityButtonText}>Confirm Attendance</Text>
              </TouchableOpacity>
            </View>
          ) : hasSeatTypes ? (
            selectedTickets.map((ticket, index) => (
              <View key={index} style={styles.ticketTypeCard}>
                <View style={styles.ticketTypeHeader}>
                  <View>
                    <Text style={styles.ticketTypeName}>{ticket.seatType.name}</Text>
                    <Text style={styles.ticketTypePrice}>
                      {t('booking.price')}: {ticket.seatType.price} {t('createEvent.riyal')}
                    </Text>
                  </View>
                </View>
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>{t('booking.quantity')}</Text>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={[styles.quantityButton, ticket.quantity === 0 && styles.quantityButtonDisabled]}
                      onPress={() => updateQuantity(ticket.seatType.name, -1)}
                      disabled={ticket.quantity === 0}
                    >
                      <Ionicons name="remove" size={20} color={ticket.quantity === 0 ? "#9ca3af" : "#000"} />
                    </TouchableOpacity>
                    <Text style={styles.quantityValue}>{ticket.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(ticket.seatType.name, 1)}
                    >
                      <Ionicons name="add" size={20} color="#000" />
                    </TouchableOpacity>
                  </View>
                  {ticket.quantity > 0 && (
                    <Text style={styles.subtotalText}>
                      {t('booking.total')}: {(ticket.seatType.price * ticket.quantity).toFixed(2)} {t('createEvent.riyal')}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.singlePriceCard}>
              <Text style={styles.singlePriceText}>
                {t('booking.price')}: {typeof event.price === 'number' 
                  ? `${event.price} ${t('createEvent.riyal')}` 
                  : typeof event.price === 'string' 
                    ? event.price 
                    : 'Free'}
              </Text>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>{t('booking.quantity')}</Text>
                <View style={styles.quantityControl}>
                  <TouchableOpacity style={styles.quantityButton}>
                    <Ionicons name="remove" size={20} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.quantityValue}>1</Text>
                  <TouchableOpacity style={styles.quantityButton}>
                    <Ionicons name="add" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Price Summary */}
        {!isFreeEvent() && totalQuantity > 0 && (
          <View style={styles.priceSummary}>
            <Text style={styles.summaryTitle}>{t('booking.grandTotal')}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('booking.total')} ({totalQuantity} {totalQuantity === 1 ? 'ticket' : 'tickets'}):</Text>
              <Text style={styles.summaryValue}>{subtotal.toFixed(2)} {t('createEvent.riyal')}</Text>
            </View>
            {processingFee > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('booking.processingFee')}:</Text>
                <Text style={styles.summaryValue}>{processingFee.toFixed(2)}</Text>
              </View>
            )}
            {tax > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('booking.tax')}:</Text>
                <Text style={styles.summaryValue}>{tax.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>{t('booking.grandTotal')}:</Text>
              <Text style={styles.grandTotalValue}>{total.toFixed(2)} {t('createEvent.riyal')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Proceed Button */}
      {!isFreeEvent() && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.proceedButton, totalQuantity === 0 && styles.proceedButtonDisabled]}
            onPress={handleProceedToPayment}
            disabled={totalQuantity === 0}
          >
            <Text style={styles.proceedButtonText}>
              {t('booking.proceedToPayment')} {totalQuantity > 0 && `(${totalQuantity})`}
            </Text>
            {totalQuantity > 0 && (
              <Text style={styles.proceedButtonSubtext}>
                {total.toFixed(2)} {t('createEvent.riyal')}
              </Text>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  eventInfo: {
    marginBottom: 24,
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  eventDetails: {
    gap: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  freeEventCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  freeEventText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
  },
  ticketTypeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ticketTypeHeader: {
    marginBottom: 16,
  },
  ticketTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  ticketTypePrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  quantityContainer: {
    gap: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A444',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    minWidth: 30,
    textAlign: 'center',
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4A444',
    marginTop: 4,
  },
  singlePriceCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  singlePriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  priceSummary: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    paddingBottom: 32,
  },
  proceedButton: {
    backgroundColor: '#D4A444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  proceedButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
});

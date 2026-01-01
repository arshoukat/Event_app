import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/api';
import Toast from 'react-native-toast-message';

interface SeatType {
  name: string;
  price: number;
  _id?: string;
}

interface SelectedTicket {
  seatType: SeatType;
  quantity: number;
}

export default function PaymentScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Store event data to get seat type indices
  const [eventPriceArray, setEventPriceArray] = useState<SeatType[]>([]);

  // Booking data from params
  const [selectedTickets, setSelectedTickets] = useState<SelectedTicket[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [eventId, setEventId] = useState('');

  useEffect(() => {
    // Parse data from URL params
    try {
      const decodedEventId = params.eventId ? decodeURIComponent(String(params.eventId)) : '';
      const decodedTickets = params.tickets ? JSON.parse(decodeURIComponent(String(params.tickets))) : [];
      
      setEventId(decodedEventId);
      setSelectedTickets(decodedTickets);
      
      // Store the price array to find seat type indices
      if (decodedTickets.length > 0) {
        const priceArray = decodedTickets.map((t: SelectedTicket) => t.seatType);
        setEventPriceArray(priceArray);
      }
      
      const subtotalValue = parseFloat(params.subtotal as string) || 0;
      const processingFeeValue = parseFloat(params.processingFee as string) || 0;
      const taxValue = parseFloat(params.tax as string) || 0;
      const totalValue = parseFloat(params.total as string) || 0;
      const totalQty = parseInt(params.totalQuantity as string) || 0;
      
      setSubtotal(subtotalValue);
      setProcessingFee(processingFeeValue);
      setTax(taxValue);
      setTotal(totalValue);
      setTotalQuantity(totalQty);
    } catch (error) {
      console.error('[Payment] Error parsing params:', error);
      Alert.alert('Error', 'Invalid payment data. Please try again.');
      router.back();
    }
  }, [params]);

  // Format card number with spaces (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Parse expiry date into month and year when user types MM/YY format
  const handleExpiryDateChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      const month = cleaned.substring(0, 2);
      const year = cleaned.substring(2, 4);
      setExpiryMonth(month);
      setExpiryYear(year ? `20${year}` : ''); // Convert YY to YYYY
      setExpiryDate(`${month}${year ? '/' + year : ''}`);
    } else {
      setExpiryMonth(cleaned);
      setExpiryDate(cleaned);
    }
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 3);
    setCvv(cleaned);
  };

  const validateForm = (): boolean => {
    // Remove spaces from card number for validation
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      Alert.alert('Error', 'Please enter a valid card number');
      return false;
    }
    
    if (!expiryMonth || expiryMonth.length !== 2 || parseInt(expiryMonth) < 1 || parseInt(expiryMonth) > 12) {
      Alert.alert('Error', 'Please enter a valid expiry month (01-12)');
      return false;
    }
    
    if (!expiryYear || expiryYear.length !== 4) {
      Alert.alert('Error', 'Please enter a valid expiry year (YYYY)');
      return false;
    }
    
    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert('Error', 'Please enter a valid CVV');
      return false;
    }
    
    if (cardholderName.trim().length < 3) {
      Alert.alert('Error', 'Please enter the cardholder name');
      return false;
    }
    
    return true;
  };

  // Find the seat type index in the original event price array
  const findSeatTypeIndex = (seatType: SeatType, allSeatTypes: SeatType[]): number => {
    return allSeatTypes.findIndex(
      st => st._id === seatType._id || 
      (st.name === seatType.name && st.price === seatType.price)
    );
  };

  const handlePayNow = async () => {
    if (!validateForm()) {
      return;
    }

    setProcessing(true);
    
    try {
      // Clean card number (remove spaces)
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      
      // Fetch event details to get the full price array for seat type indices
      const eventResponse = await apiService.get<{ success: boolean; data: any } | any>(`/events/${eventId}`);
      const eventData = (eventResponse as any)?.data || eventResponse;
      const fullPriceArray = Array.isArray(eventData.price) ? eventData.price : [];
      
      // Process each selected ticket (API handles one seat type at a time)
      const paymentPromises = selectedTickets
        .filter(ticket => ticket.quantity > 0)
        .flatMap(ticket => {
          const seatTypeIndex = findSeatTypeIndex(ticket.seatType, fullPriceArray);
          if (seatTypeIndex === -1) {
            console.warn(`[Payment] Could not find seat type index for ${ticket.seatType.name}`);
            return [];
          }
          
          // Create a payment request for each quantity (API might handle quantity, but we'll make separate calls to be safe)
          return Array.from({ length: ticket.quantity }, () => {
            return apiService.post(`/payments/event/${eventId}/pay`, {
              cardNumber: cleanedCardNumber,
              cardHolder: cardholderName.trim(),
              expiryMonth: expiryMonth.padStart(2, '0'),
              expiryYear: expiryYear,
              cvv: cvv,
              seatTypeIndex: seatTypeIndex,
            });
          });
        });

      if (paymentPromises.length === 0) {
        throw new Error('No tickets selected for payment');
      }

      console.log(`[Payment] Processing ${paymentPromises.length} payment(s)...`);
      
      // Execute all payment requests
      const results = await Promise.all(paymentPromises);
      
      console.log('[Payment] All payments processed successfully:', results);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: t('payment.success'),
        text2: `Payment of ${total.toFixed(2)} SAR processed successfully`,
        visibilityTime: 3000,
      });

      // Navigate to tickets screen after a short delay
      setTimeout(() => {
        router.replace('/tickets');
      }, 1500);
      
    } catch (error: any) {
      console.error('[Payment] Payment failed:', error);
      const errorMessage = error?.message || error?.data?.message || error?.data?.error || 'Payment processing failed. Please try again.';
      Alert.alert(
        t('payment.failed'),
        errorMessage
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('payment.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          {selectedTickets.map((ticket, index) => (
            <View key={index} style={styles.ticketRow}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{ticket.seatType.name}</Text>
                <Text style={styles.ticketQuantity}>x{ticket.quantity}</Text>
              </View>
              <Text style={styles.ticketPrice}>
                {(ticket.seatType.price * ticket.quantity).toFixed(2)} {t('createEvent.riyal')}
              </Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
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
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('booking.grandTotal')}:</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} {t('createEvent.riyal')}</Text>
          </View>
        </View>

        {/* Payment Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          
          {/* Card Number */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('payment.cardNumber')} *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                keyboardType="numeric"
                maxLength={19}
                placeholderTextColor="#9ca3af"
              />
              <Ionicons name="card-outline" size={20} color="#6b7280" style={styles.inputIcon} />
            </View>
          </View>

          {/* Expiry Month, Year and CVV */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>Expiry Month *</Text>
              <TextInput
                style={styles.input}
                placeholder="12"
                value={expiryMonth}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').substring(0, 2);
                  setExpiryMonth(cleaned);
                  if (expiryYear) {
                    setExpiryDate(cleaned && expiryYear ? `${cleaned}/${expiryYear.slice(-2)}` : cleaned);
                  }
                }}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1.2 }]}>
              <Text style={styles.label}>Expiry Year *</Text>
              <TextInput
                style={styles.input}
                placeholder="2025"
                value={expiryYear}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').substring(0, 4);
                  setExpiryYear(cleaned);
                  if (expiryMonth) {
                    setExpiryDate(cleaned ? `${expiryMonth}/${cleaned.slice(-2)}` : expiryMonth);
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
                placeholderTextColor="#9ca3af"
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Text style={styles.label}>{t('payment.cvv')} *</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                value={cvv}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '').substring(0, 4);
                  setCvv(cleaned);
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Cardholder Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('payment.cardholderName')} *</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={cardholderName}
              onChangeText={setCardholderName}
              autoCapitalize="words"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="lock-closed-outline" size={16} color="#6b7280" />
          <Text style={styles.securityText}>
            Your payment information is secure and encrypted
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.payButtonText}>{t('payment.payNow')}</Text>
              <Text style={styles.payButtonAmount}>
                {total.toFixed(2)} {t('createEvent.riyal')}
              </Text>
            </>
          )}
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
    paddingBottom: 100,
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
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ticketInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  ticketQuantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  ticketPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4A444',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    paddingRight: 40,
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
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
  payButton: {
    backgroundColor: '#D4A444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  payButtonAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});


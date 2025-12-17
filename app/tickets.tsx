import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { getTicketsByStatus, Ticket, mockTickets } from '../data/mockData';
import { ImageWithFallback } from '../components/ImageWithFallback';

export default function TicketsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Only show booked tickets (exclude cancelled)
  const allBookedTickets = mockTickets.filter(ticket => ticket.status !== 'cancelled');
  const upcomingTickets = allBookedTickets.filter(ticket => ticket.status === 'upcoming');
  const pastTickets = allBookedTickets.filter(ticket => ticket.status === 'past');
  const tickets = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

  const renderTicket = (ticket: Ticket) => (
    <TouchableOpacity
      key={ticket.id}
      style={styles.ticketCard}
      onPress={() => router.push(`/event-detail?id=${ticket.eventId}`)}
    >
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
      
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            {t('tickets.upcoming')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('tickets.past')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {tickets.length > 0 ? (
          tickets.map(renderTicket)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? t('tickets.noUpcoming') : t('tickets.noPast')}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' ? t('tickets.bookTickets') : t('tickets.attendedTickets')}
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
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
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
});


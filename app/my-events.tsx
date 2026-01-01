import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { mockEvents } from '../data/mockData';
import { EventCard } from '../components/EventCard';

export default function MyEventsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  // Helper function to parse date string like "Dec 15, 2025"
  const parseEventDate = (dateStr: string): Date => {
    const months: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const parts = dateStr.split(', ');
    if (parts.length === 2) {
      const datePart = parts[0].split(' ');
      const month = months[datePart[0]] || 0;
      const day = parseInt(datePart[1]) || 1;
      const year = parseInt(parts[1]) || new Date().getFullYear();
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  // Mock user's created events - filter by date to show upcoming vs past
  const now = new Date();
  const myEvents = mockEvents; // All events are user's events for now
  
  // Split events into upcoming and past based on date
  const upcomingEvents = myEvents.filter(event => {
    const eventDate = parseEventDate(event.date);
    return eventDate >= now;
  });
  
  const pastEvents = myEvents.filter(event => {
    const eventDate = parseEventDate(event.date);
    return eventDate < now;
  });
  
  const events = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

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
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            {t('myEvents.past')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {events.length > 0 ? (
          events.map(event => (
            <EventCard
              key={event.id}
              event={{
                ...event,
                price: typeof event.price === 'number' ? `$${event.price}` : event.price
              }}
              onViewDetails={(id) => router.push(`/event-detail?id=${encodeURIComponent(String(id))}`)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? t('myEvents.noUpcoming') : t('myEvents.noPast')}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming' ? t('myEvents.bookTickets') : t('myEvents.attendedEvents')}
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
});

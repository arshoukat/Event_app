import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { EventCard } from '../components/EventCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { getEventsByCategory } from '../data/mockData';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredEvents = getEventsByCategory(selectedCategory);

  const handleViewEvent = (eventId: number) => {
    router.push(`/event-detail?id=${eventId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={{
                  ...event,
                  price: typeof event.price === 'number' ? `$${event.price}` : event.price
                }}
                onViewDetails={handleViewEvent}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
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
    backgroundColor: '#000',
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
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
});


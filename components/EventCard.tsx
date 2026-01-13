import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ImageWithFallback } from './ImageWithFallback';

interface Event {
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

interface EventCardProps {
  event: Event;
  onViewDetails: (id: number | string, visibility?: 'public' | 'private') => void;
  onSave?: (id: number | string) => void;
}

export function EventCard({ event, onViewDetails, onSave }: EventCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <ImageWithFallback
          src={event.image}
          style={styles.image}
        />
        <TouchableOpacity 
          style={styles.bookmarkButton}
          onPress={() => onSave && onSave(event.id)}
        >
          <Ionicons name="bookmark-outline" size={16} color="#000" />
        </TouchableOpacity>
        {/* Visibility Badge */}
        {event.visibility && (
          <View style={[
            styles.visibilityBadge,
            event.visibility === 'private' && styles.visibilityBadgePrivate
          ]}>
            <Ionicons 
              name={event.visibility === 'private' ? 'lock-closed' : 'globe'} 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.visibilityText}>
              {event.visibility === 'private' ? 'Private' : 'Public'}
            </Text>
          </View>
        )}
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{event.price}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{event.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{event.attendees} attending</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={() => onViewDetails(event.id, event.visibility)}
          style={styles.button}
        >
          <Text style={styles.buttonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 192,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
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
  visibilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  visibilityBadgePrivate: {
    backgroundColor: '#6366f1',
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#D4A444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  details: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  button: {
    width: '100%',
    backgroundColor: '#000',
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


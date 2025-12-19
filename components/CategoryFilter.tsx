import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const categories = [
    { id: 'all', label: 'All', icon: 'sparkles' },
    { id: 'music', label: 'Music', icon: 'musical-notes' },
    { id: 'tech', label: 'Tech', icon: 'laptop' },
    { id: 'networking', label: 'Network', icon: 'people' },
    { id: 'art', label: 'Art', icon: 'color-palette' },
    { id: 'wellness', label: 'Wellness', icon: 'heart' }
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map(category => {
        const isActive = selectedCategory === category.id;
        
        return (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelectCategory(category.id)}
            style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
          >
            <Ionicons 
              name={category.icon as any} 
              size={16} 
              color={isActive ? '#fff' : '#374151'} 
            />
            <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonActive: {
    backgroundColor: '#D4A444',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#374151',
  },
  categoryLabelActive: {
    color: '#fff',
  },
});


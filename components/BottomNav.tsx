import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

export type Screen = 'home' | 'my-events' | 'tickets' | 'profile';

interface BottomNavProps {
  activeView: string;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ activeView, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  
  const navItems: Array<{ id: Screen; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
    { id: 'home', label: t('nav.home'), icon: 'home' },
    { id: 'my-events', label: t('nav.myEvents'), icon: 'calendar' },
    { id: 'tickets', label: t('nav.tickets'), icon: 'ticket' },
    { id: 'profile', label: t('nav.profile'), icon: 'person' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onNavigate(item.id)}
              style={styles.navItem}
            >
              <Ionicons 
                name={isActive ? item.icon : `${item.icon}-outline` as any} 
                size={20} 
                color={isActive ? '#D4A444' : '#9ca3af'} 
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  navLabelActive: {
    color: '#D4A444',
  },
});


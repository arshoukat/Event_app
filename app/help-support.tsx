import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How do I create an event?',
    answer: 'To create an event, go to the Home screen and tap the "Create Event" button. Fill in all the required details including title, description, date, time, location, and category. You can also add a cover image and set pricing options.',
  },
  {
    id: '2',
    question: 'How do I book tickets?',
    answer: 'Browse events on the Home screen, tap on an event you\'re interested in, and then tap "Book Ticket". Select the ticket type and quantity, then proceed to payment.',
  },
  {
    id: '3',
    question: 'Can I cancel my ticket?',
    answer: 'Ticket cancellation policies vary by event. Check the event details for specific cancellation terms. Generally, refunds are available up to 24 hours before the event starts.',
  },
  {
    id: '4',
    question: 'How do I update my profile?',
    answer: 'Go to your Profile screen and tap "Edit Profile". You can update your name, email, phone number, location, and bio. Don\'t forget to save your changes.',
  },
  {
    id: '5',
    question: 'How do I add a payment method?',
    answer: 'Go to your Profile screen, tap "Payment Methods", and then tap "Add Payment Method". Enter your card details and save.',
  },
  {
    id: '6',
    question: 'I forgot my password. How do I reset it?',
    answer: 'On the login screen, tap "Forgot Password?" and enter your email address. You\'ll receive an OTP code to verify your identity, then you can create a new password.',
  },
];

export default function HelpSupportScreen() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:support@ducat.com?subject=Support Request');
  };

  const handleReportIssue = () => {
    Linking.openURL('mailto:support@ducat.com?subject=Bug Report');
  };

  const handleTermsOfService = () => {
    // TODO: Navigate to terms of service page or open URL
    Alert.alert('Terms of Service', 'Terms of Service page will be implemented');
  };

  const handlePrivacyPolicy = () => {
    // TODO: Navigate to privacy policy page or open URL
    Alert.alert('Privacy Policy', 'Privacy Policy page will be implemented');
  };

  const helpSections = [
    {
      title: t('help.faq'),
      icon: 'help-circle-outline',
      items: faqData,
    },
    {
      title: t('help.contactUs'),
      icon: 'mail-outline',
      action: handleContactUs,
    },
    {
      title: t('help.reportIssue'),
      icon: 'bug-outline',
      action: handleReportIssue,
    },
    {
      title: t('help.termsOfService'),
      icon: 'document-text-outline',
      action: handleTermsOfService,
    },
    {
      title: t('help.privacyPolicy'),
      icon: 'shield-checkmark-outline',
      action: handlePrivacyPolicy,
    },
    {
      title: t('help.aboutUs'),
      icon: 'information-circle-outline',
      action: () => Alert.alert('About Us', 'Ducat Event App - Your gateway to amazing events and experiences.'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={24} color="#D4A444" />
            <Text style={styles.sectionTitle}>{t('help.faq')}</Text>
          </View>
          <View style={styles.faqContainer}>
            {faqData.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFAQ(faq.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  <Ionicons
                    name={expandedFAQ === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
                {expandedFAQ === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Other Help Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Options</Text>
          <View style={styles.optionsContainer}>
            {helpSections.slice(1).map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionItem}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={styles.optionItemLeft}>
                  <Ionicons name={option.icon as any} size={20} color="#374151" />
                  <Text style={styles.optionItemLabel}>{option.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Need More Help?</Text>
          <Text style={styles.contactText}>
            Our support team is available 24/7 to assist you.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactUs}
          >
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionItemLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D4A444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

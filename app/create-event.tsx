import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { encode } from 'base-64';
import Toast from 'react-native-toast-message';

// Conditionally import DateTimePicker only on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker not available:', e);
  }
}

export default function CreateEventScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  
  interface SeatType {
    id: string;
    name: string;
    price: string;
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    location: '',
    venue: '',
    eventType: 'in-person' as 'in-person' | 'online',
    capacity: '',
    price: '',
    category: '',
    visibility: 'public' as 'public' | 'private',
    isPaid: false,
    iban: '', // IBAN for paid events
    seatTypes: [] as SeatType[],
    requiresLicense: false,
    licenseFile: null as string | null,
    requireApproval: false,
    allowGuests: true,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [licenseFileUri, setLicenseFileUri] = useState<string | null>(null);
  const [newSeatType, setNewSeatType] = useState({ name: '', price: '' });
  const [showSeatTypePicker, setShowSeatTypePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Seat type options for dropdown
  const seatTypeOptions = [
    { value: 'General seat', label: 'General seat' },
    { value: 'Pro seat', label: 'Pro seat' },
    { value: 'VIP seat', label: 'VIP seat' },
  ];

  const categories = [
    { value: 'music', label: t('category.music') },
    { value: 'tech', label: t('category.tech') },
    { value: 'art', label: t('category.art') },
    { value: 'sports', label: t('category.sports') },
    { value: 'food', label: t('category.food') },
    { value: 'networking', label: t('category.networking') },
    { value: 'wellness', label: t('category.wellness') },
    { value: 'education', label: t('category.education') },
    { value: 'entertainment', label: t('category.entertainment') },
    { value: 'other', label: t('category.other') },
  ];

  const handleInputChange = (field: string, value: string | boolean | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleAddInviteEmail = () => {
    const email = inviteEmailInput.trim();
    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      if (invitedEmails.includes(email)) {
        Alert.alert('Error', 'This email is already in the invite list');
        return;
      }
      setInvitedEmails(prev => [...prev, email]);
      setInviteEmailInput('');
    }
  };

  const handleRemoveInviteEmail = (index: number) => {
    setInvitedEmails(prev => prev.filter((_, i) => i !== index));
  };

  // Function to encode IBAN (using base64 encoding)
  const encodeIBAN = (iban: string): string => {
    // Remove spaces and convert to uppercase
    const cleanedIBAN = iban.replace(/\s/g, '').toUpperCase();
    // Encode to base64
    return encode(cleanedIBAN);
  };

  // IBAN validation function
  const validateIBAN = (iban: string): boolean => {
    // Basic IBAN validation (2 letters + 2 digits + up to 30 alphanumeric)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    return ibanRegex.test(cleaned);
  };

  const handleAddSeatType = () => {
    if (newSeatType.name.trim() && newSeatType.price.trim()) {
      const seatType: SeatType = {
        id: Date.now().toString(),
        name: newSeatType.name.trim(),
        price: newSeatType.price.trim(),
      };
      setFormData(prev => ({
        ...prev,
        seatTypes: [...prev.seatTypes, seatType]
      }));
      setNewSeatType({ name: '', price: '' });
    }
  };

  const handleRemoveSeatType = (id: string) => {
    setFormData(prev => ({
      ...prev,
      seatTypes: prev.seatTypes.filter(st => st.id !== id)
    }));
  };

  const handleLicenseUpload = async () => {
    try {
      // Launch document picker for PDF files only
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        // Store the file name and URI
        setFormData(prev => ({
          ...prev,
          licenseFile: selectedFile.name || 'license-document.pdf'
        }));
        setLicenseFileUri(selectedFile.uri);
        
        console.log('Selected PDF file:', selectedFile.name, selectedFile.uri);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick PDF file. Please try again.');
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
          return;
        }
      }

      // Launch image picker with base64 option
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 9], // Standard cover image aspect ratio
        quality: 0.8,
        base64: true, // Enable base64 encoding
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setCoverImage(selectedImage.uri);
        // Store base64 string if available
        if (selectedImage.base64) {
          // Format: data:image/jpeg;base64,{base64string}
          const base64String = `data:image/jpeg;base64,${selectedImage.base64}`;
          setCoverImageBase64(base64String);
        } else {
          setCoverImageBase64(null);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date for HTML5 date input (YYYY-MM-DD)
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time for HTML5 time input (HH:MM)
  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (formData.eventType === 'in-person' && !formData.location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (formData.isPaid && formData.seatTypes.length === 0) {
      Alert.alert('Error', t('createEvent.addAtLeastOneSeatType'));
      return;
    }
    if (formData.isPaid && !formData.iban.trim()) {
      Alert.alert('Error', 'Please enter your IBAN number');
      return;
    }
    if (formData.isPaid && !validateIBAN(formData.iban)) {
      Alert.alert('Error', 'Please enter a valid IBAN number');
      return;
    }
    if (formData.requiresLicense && !formData.licenseFile) {
      Alert.alert('Error', t('createEvent.uploadLicenseRequired') || 'Please upload a license file');
      return;
    }
    if (formData.visibility === 'private' && invitedEmails.length === 0) {
      Alert.alert('Error', 'Please add at least one email address for private events');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get authentication token
      const token = await storageService.getToken();
      if (!token) {
        Alert.alert('Error', 'Please login to create an event');
        router.push('/login');
        return;
      }

      // Combine date and startTime into ISO format for main date
      const eventDate = new Date(formData.date);
      const startTimeDate = new Date(formData.startTime);
      eventDate.setHours(startTimeDate.getHours());
      eventDate.setMinutes(startTimeDate.getMinutes());
      eventDate.setSeconds(0);
      eventDate.setMilliseconds(0);
      
      // Combine date and endTime
      const endTimeDate = new Date(formData.date);
      const endTime = new Date(formData.endTime);
      endTimeDate.setHours(endTime.getHours());
      endTimeDate.setMinutes(endTime.getMinutes());
      endTimeDate.setSeconds(0);
      endTimeDate.setMilliseconds(0);
      
      // Prepare price array - array of seat types with prices
      let price: Array<{ name: string; price: number }> = [];
      if (formData.isPaid && formData.seatTypes.length > 0) {
        // Convert seat types to price array format
        price = formData.seatTypes.map(st => ({
          name: st.name,
          price: parseFloat(st.price) || 0
        }));
      }
      // For free events, price remains an empty array

      // Prepare event data according to API format
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: eventDate.toISOString(),
        startTime: eventDate.toISOString(), // Start time combined with date
        endTime: endTimeDate.toISOString(), // End time combined with date
        location: formData.location.trim() || formData.venue.trim(),
        venue: formData.venue.trim() || undefined, // Venue field
        category: formData.category,
        price: price, // Now an array of seat types with prices
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        status: 'published', // You can change this to 'draft' if needed
        imageUrl: coverImageBase64 || null, // Use base64 if available, otherwise null
        tags: formData.tags, // Tags array
        visibility: formData.visibility, // Privacy/visibility field
        invitedEmails: formData.visibility === 'private' ? invitedEmails : undefined, // Invited emails if private
        licenseFile: formData.requiresLicense && formData.licenseFile ? formData.licenseFile : undefined, // License file if required
        iban: formData.isPaid ? encodeIBAN(formData.iban) : undefined, // Encoded IBAN for paid events
      };

      console.log('Event data being sent:', eventData);
      console.log('Cover image URI:', coverImage);
      console.log('Cover image base64 available:', !!coverImageBase64);

      console.log('Creating event with data:', eventData);

      // Call the API - using the events endpoint
      // Note: Ensure API_URL in services/api.ts matches your backend URL
      // If your events API is on port 5001, update EXPO_PUBLIC_API_URL or the default in api.ts
      const result = await apiService.post('/events', eventData);
      
      console.log('Event created successfully:', result);
      
      // Redirect to home immediately with success flag
      router.replace('/home?eventCreated=true');
    } catch (err: any) {
      console.error('Failed to create event:', err);
      const errorMessage = err?.message || 'Failed to create event. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('createEvent.title')}</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]}
          disabled={isSubmitting}
        >
          <Text style={styles.publishButtonText}>
            {isSubmitting ? 'Publishing...' : t('createEvent.publish')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Cover Image */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('createEvent.coverImage')}</Text>
          {coverImage ? (
            <View style={styles.imageContainer}>
              <ImageWithFallback src={coverImage} style={styles.coverImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setCoverImage('')}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imageUpload}
              onPress={handleImagePick}
            >
              <Ionicons name="cloud-upload-outline" size={32} color="#9ca3af" />
              <Text style={styles.uploadText}>{t('createEvent.uploadCover')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Event Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.eventTitle')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder={t('createEvent.eventTitlePlaceholder')}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.description')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder={t('createEvent.descriptionPlaceholder')}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.date')} <Text style={styles.required}>*</Text>
          </Text>
          {Platform.OS === 'web' ? (
            <View style={styles.dateButton}>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <TextInput
                style={styles.dateInput}
                // @ts-ignore - type is supported on react-native-web
                type="date"
                value={formatDateForInput(formData.date)}
                // @ts-ignore - onChange is supported on react-native-web
                onChange={(e: any) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    handleInputChange('date', date);
                  }
                }}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => {
                if (!DateTimePicker) {
                  Alert.alert('Error', 'Date picker is not available. Please rebuild the app with: npx expo prebuild');
                } else {
                  console.log('Date picker button pressed, opening picker...');
                  setShowDatePicker(true);
                }
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text style={styles.dateInput}>
                {formatDate(formData.date)}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.label}>
                {t('createEvent.startTime')} <Text style={styles.required}>*</Text>
              </Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateButton}>
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.dateInput}
                    // @ts-ignore - type is supported on react-native-web
                    type="time"
                    value={formatTimeForInput(formData.startTime)}
                    // @ts-ignore - onChange is supported on react-native-web
                    onChange={(e: any) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const date = new Date();
                      date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                      handleInputChange('startTime', date);
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    if (!DateTimePicker) {
                      Alert.alert('Error', 'Time picker is not available.');
                    } else {
                      setShowStartTimePicker(true);
                    }
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <Text style={styles.dateInput}>
                    {formatTime(formData.startTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.label}>{t('createEvent.endTime')}</Text>
              {Platform.OS === 'web' ? (
                <View style={styles.dateButton}>
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <TextInput
                    style={styles.dateInput}
                    // @ts-ignore - type is supported on react-native-web
                    type="time"
                    value={formatTimeForInput(formData.endTime)}
                    // @ts-ignore - onChange is supported on react-native-web
                    onChange={(e: any) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const date = new Date();
                      date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                      handleInputChange('endTime', date);
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    if (!DateTimePicker) {
                      Alert.alert('Error', 'Time picker is not available.');
                    } else {
                      setShowEndTimePicker(true);
                    }
                  }}
                >
                  <Ionicons name="time-outline" size={20} color="#6b7280" />
                  <Text style={styles.dateInput}>
                    {formatTime(formData.endTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Date Picker Modal */}
        {Platform.OS !== 'web' && DateTimePicker && showDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.date}
                    mode="date"
                    display="spinner"
                    onChange={(event: any, selectedDate?: Date) => {
                      console.log('Date picker onChange:', event.type, selectedDate);
                      if (event.type === 'set' && selectedDate) {
                        handleInputChange('date', selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display="default"
              onChange={(event: any, selectedDate?: Date) => {
                console.log('Android date picker onChange:', event.type, selectedDate);
                setShowDatePicker(false);
                if (event.type === 'set' && selectedDate) {
                  handleInputChange('date', selectedDate);
                }
              }}
              minimumDate={new Date()}
            />
          )
        )}

        {/* Start Time Picker Modal */}
        {Platform.OS !== 'web' && DateTimePicker && showStartTimePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              visible={showStartTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowStartTimePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowStartTimePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Start Time</Text>
                    <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.startTime}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(event: any, selectedTime?: Date) => {
                      console.log('Start time picker onChange:', event.type, selectedTime);
                      if (event.type === 'set' && selectedTime) {
                        handleInputChange('startTime', selectedTime);
                      }
                    }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={formData.startTime}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={(event: any, selectedTime?: Date) => {
                console.log('Android start time picker onChange:', event.type, selectedTime);
                setShowStartTimePicker(false);
                if (event.type === 'set' && selectedTime) {
                  handleInputChange('startTime', selectedTime);
                }
              }}
            />
          )
        )}

        {/* End Time Picker Modal */}
        {Platform.OS !== 'web' && DateTimePicker && showEndTimePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              visible={showEndTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowEndTimePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowEndTimePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select End Time</Text>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.endTime}
                    mode="time"
                    display="spinner"
                    is24Hour={false}
                    onChange={(event: any, selectedTime?: Date) => {
                      console.log('End time picker onChange:', event.type, selectedTime);
                      if (event.type === 'set' && selectedTime) {
                        handleInputChange('endTime', selectedTime);
                      }
                    }}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={(event: any, selectedTime?: Date) => {
                console.log('Android end time picker onChange:', event.type, selectedTime);
                setShowEndTimePicker(false);
                if (event.type === 'set' && selectedTime) {
                  handleInputChange('endTime', selectedTime);
                }
              }}
            />
          )
        )}

        {/* Event Type */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.eventType')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.eventType === 'in-person' && styles.typeButtonActive
              ]}
              onPress={() => handleInputChange('eventType', 'in-person')}
            >
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={formData.eventType === 'in-person' ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.eventType === 'in-person' && styles.typeButtonTextActive
              ]}>
                {t('createEvent.inPerson')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.eventType === 'online' && styles.typeButtonActive
              ]}
              onPress={() => handleInputChange('eventType', 'online')}
            >
              <Ionicons 
                name="globe-outline" 
                size={16} 
                color={formData.eventType === 'online' ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.eventType === 'online' && styles.typeButtonTextActive
              ]}>
                {t('createEvent.online')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location */}
        {formData.eventType === 'in-person' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>
                {t('createEvent.location')} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                placeholder={t('createEvent.locationPlaceholder')}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.section}>
              <Text style={styles.label}>{t('createEvent.venue')}</Text>
              <TextInput
                style={styles.input}
                value={formData.venue}
                onChangeText={(value) => handleInputChange('venue', value)}
                placeholder={t('createEvent.venuePlaceholder')}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>{t('createEvent.onlineLink')}</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              placeholder={t('createEvent.onlineLinkPlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="url"
            />
          </View>
        )}

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.category')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  formData.category === cat.value && styles.categoryButtonActive
                ]}
                onPress={() => handleInputChange('category', cat.value)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  formData.category === cat.value && styles.categoryButtonTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('createEvent.capacity')}</Text>
          <TextInput
            style={styles.input}
            value={formData.capacity}
            onChangeText={(value) => handleInputChange('capacity', value)}
            placeholder={t('createEvent.capacityPlaceholder')}
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
        </View>

        {/* Paid or Free */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.paymentType')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                !formData.isPaid && styles.typeButtonActive
              ]}
              onPress={() => handleInputChange('isPaid', false)}
            >
              <Ionicons 
                name="gift-outline" 
                size={16} 
                color={!formData.isPaid ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.typeButtonText,
                !formData.isPaid && styles.typeButtonTextActive
              ]}>
                {t('createEvent.free')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.isPaid && styles.typeButtonActive
              ]}
              onPress={() => handleInputChange('isPaid', true)}
            >
              <Ionicons 
                name="card-outline" 
                size={16} 
                color={formData.isPaid ? '#fff' : '#000'} 
              />
              <Text style={[
                styles.typeButtonText,
                formData.isPaid && styles.typeButtonTextActive
              ]}>
                {t('createEvent.paid')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* IBAN Input (if Paid) */}
        {formData.isPaid && (
          <View style={styles.section}>
            <Text style={styles.label}>
              IBAN Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.iban}
              onChangeText={(value) => handleInputChange('iban', value)}
              placeholder="Enter your IBAN number"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.hintText}>
              Format: 2 letters + 2 digits + up to 30 alphanumeric characters
            </Text>
          </View>
        )}

        {/* Payment Structure (if Paid) */}
        {formData.isPaid && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {t('createEvent.paymentStructure')} <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.hintText}>{t('createEvent.paymentStructureHint')}</Text>
            
            {/* Existing Seat Types */}
            {formData.seatTypes.length > 0 && (
              <View style={styles.seatTypesContainer}>
                {formData.seatTypes.map((seatType) => (
                  <View key={seatType.id} style={styles.seatTypeItem}>
                    <View style={styles.seatTypeInfo}>
                      <Text style={styles.seatTypeName}>{seatType.name}</Text>
                      <Text style={styles.seatTypePrice}>{seatType.price} {t('createEvent.riyal')}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveSeatType(seatType.id)}
                      style={styles.removeSeatTypeButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add New Seat Type */}
            <View style={styles.addSeatTypeContainer}>
              <View style={styles.seatTypeInputRow}>
                {/* Seat Type Dropdown */}
                <TouchableOpacity
                  style={[styles.input, styles.seatTypeNameInput, styles.dropdownButton]}
                  onPress={() => setShowSeatTypePicker(true)}
                >
                  <Text style={newSeatType.name ? styles.inputText : styles.placeholderText}>
                    {newSeatType.name || t('createEvent.selectSeatType') || 'Select Seat Type'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" style={styles.dropdownIcon} />
                </TouchableOpacity>
                
                <TextInput
                  style={[styles.input, styles.seatTypePriceInput]}
                  value={newSeatType.price}
                  onChangeText={(value) => setNewSeatType(prev => ({ ...prev, price: value }))}
                  placeholder={t('createEvent.price')}
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[styles.addSeatTypeButton, (!newSeatType.name.trim() || !newSeatType.price.trim()) && styles.addSeatTypeButtonDisabled]}
                  onPress={handleAddSeatType}
                  disabled={!newSeatType.name.trim() || !newSeatType.price.trim()}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Seat Type Picker Modal */}
            {showSeatTypePicker && (
              <Modal
                visible={showSeatTypePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSeatTypePicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowSeatTypePicker(false)}
                >
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Seat Type</Text>
                      <TouchableOpacity onPress={() => setShowSeatTypePicker(false)}>
                        <Text style={styles.modalDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView>
                      {seatTypeOptions.map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.pickerOption,
                            newSeatType.name === option.value && styles.pickerOptionSelected
                          ]}
                          onPress={() => {
                            setNewSeatType(prev => ({ ...prev, name: option.value }));
                            setShowSeatTypePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            newSeatType.name === option.value && styles.pickerOptionTextSelected
                          ]}>
                            {option.label}
                          </Text>
                          {newSeatType.name === option.value && (
                            <Ionicons name="checkmark" size={20} color="#D4A444" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
        )}

        {/* License Requirement */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>{t('createEvent.requiresLicense')}</Text>
              <Text style={styles.switchHint}>{t('createEvent.requiresLicenseHint')}</Text>
            </View>
            <Switch
              value={formData.requiresLicense}
              onValueChange={(value) => handleInputChange('requiresLicense', value)}
              trackColor={{ false: '#e5e7eb', true: '#D4A444' }}
              thumbColor="#fff"
            />
          </View>

          {formData.requiresLicense && (
            <View style={styles.licenseUploadContainer}>
              {formData.licenseFile ? (
                <View style={styles.licenseFileContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#6b7280" />
                  <Text style={styles.licenseFileName}>{formData.licenseFile}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      handleInputChange('licenseFile', null);
                      setLicenseFileUri(null);
                    }}
                    style={styles.removeLicenseButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.licenseUploadButton}
                  onPress={handleLicenseUpload}
                >
                  <Ionicons name="cloud-upload-outline" size={24} color="#6b7280" />
                  <Text style={styles.licenseUploadText}>{t('createEvent.uploadLicense')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('createEvent.tags')}</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder={t('createEvent.addTag')}
              placeholderTextColor="#9ca3af"
              onSubmitEditing={handleAddTag}
              editable={formData.tags.length < 5}
            />
            <TouchableOpacity
              style={[styles.addTagButton, (!tagInput.trim() || formData.tags.length >= 5) && styles.addTagButtonDisabled]}
              onPress={handleAddTag}
              disabled={!tagInput.trim() || formData.tags.length >= 5}
            >
              <Text style={styles.addTagButtonText}>{t('createEvent.add')}</Text>
            </TouchableOpacity>
          </View>
          {formData.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {formData.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(index)}>
                    <Ionicons name="close-circle" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, styles.privacySection]}>
          <Text style={styles.sectionTitle}>{t('createEvent.privacySettings')}</Text>
          
          <View style={styles.privacyRow}>
            <Text style={styles.label}>
              {t('createEvent.visibility')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.visibility === 'public' && styles.typeButtonActive
                ]}
                onPress={() => handleInputChange('visibility', 'public')}
              >
                <Ionicons 
                  name="globe-outline" 
                  size={16} 
                  color={formData.visibility === 'public' ? '#fff' : '#000'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.visibility === 'public' && styles.typeButtonTextActive
                ]}>
                  {t('createEvent.public')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.visibility === 'private' && styles.typeButtonActive
                ]}
                onPress={() => handleInputChange('visibility', 'private')}
              >
                <Ionicons 
                  name="lock-closed-outline" 
                  size={16} 
                  color={formData.visibility === 'private' ? '#fff' : '#000'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formData.visibility === 'private' && styles.typeButtonTextActive
                ]}>
                  {t('createEvent.private')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('createEvent.requireApproval')}</Text>
            <Switch
              value={formData.requireApproval}
              onValueChange={(value) => handleInputChange('requireApproval', value)}
              trackColor={{ false: '#e5e7eb', true: '#D4A444' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('createEvent.allowGuests')}</Text>
            <Switch
              value={formData.allowGuests}
              onValueChange={(value) => handleInputChange('allowGuests', value)}
              trackColor={{ false: '#e5e7eb', true: '#D4A444' }}
              thumbColor="#fff"
            />
          </View>

          {/* Invite Emails - Only show when visibility is private */}
          {formData.visibility === 'private' && (
            <View style={styles.inviteSection}>
              <Text style={styles.label}>
                {t('createEvent.inviteEmails') || 'Invite by Email'} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={[styles.input, styles.tagInput]}
                  value={inviteEmailInput}
                  onChangeText={setInviteEmailInput}
                  placeholder={t('createEvent.inviteEmailPlaceholder') || 'Enter email address'}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleAddInviteEmail}
                />
                <TouchableOpacity
                  style={[styles.addTagButton, !inviteEmailInput.trim() && styles.addTagButtonDisabled]}
                  onPress={handleAddInviteEmail}
                  disabled={!inviteEmailInput.trim()}
                >
                  <Text style={styles.addTagButtonText}>{t('createEvent.add') || 'Add'}</Text>
                </TouchableOpacity>
              </View>
              {invitedEmails.length > 0 && (
                <View style={styles.tagsContainer}>
                  {invitedEmails.map((email, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{email}</Text>
                      <TouchableOpacity onPress={() => handleRemoveInviteEmail(index)}>
                        <Ionicons name="close-circle" size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {invitedEmails.length === 0 && (
                <Text style={styles.hintText}>
                  {t('createEvent.inviteEmailHint') || 'Add email addresses of people you want to invite to this private event'}
                </Text>
              )}
            </View>
          )}
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
  publishButton: {
    backgroundColor: '#D4A444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  privacySection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeColumn: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfColumn: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#D4A444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addTagButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  privacyRow: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  switchLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  seatTypesContainer: {
    marginBottom: 12,
    gap: 8,
  },
  seatTypeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  seatTypeInfo: {
    flex: 1,
  },
  seatTypeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  seatTypePrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeSeatTypeButton: {
    padding: 4,
  },
  addSeatTypeContainer: {
    marginTop: 8,
  },
  seatTypeInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  seatTypeNameInput: {
    flex: 2,
  },
  seatTypePriceInput: {
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9ca3af',
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: {
    backgroundColor: '#fef3c7',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#D4A444',
    fontWeight: '500',
  },
  addSeatTypeButton: {
    backgroundColor: '#D4A444',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  addSeatTypeButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  licenseUploadContainer: {
    marginTop: 12,
  },
  licenseUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
  },
  licenseUploadText: {
    fontSize: 14,
    color: '#6b7280',
  },
  licenseFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  licenseFileName: {
    flex: 1,
    fontSize: 14,
  },
  inviteSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  removeLicenseButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4A444',
  },
});

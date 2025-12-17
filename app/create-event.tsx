import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { ImageWithFallback } from '../components/ImageWithFallback';
// Using built-in date/time inputs - for production, consider expo-date-picker

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
    seatTypes: [] as SeatType[],
    requiresLicense: false,
    licenseFile: null as string | null,
    requireApproval: false,
    allowGuests: true,
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [newSeatType, setNewSeatType] = useState({ name: '', price: '' });

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

  const handleInputChange = (field: string, value: string | boolean | Date) => {
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

  const handleLicenseUpload = () => {
    // In a real app, this would open document picker
    Alert.alert('License Upload', 'PDF picker will be implemented with expo-document-picker', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Select PDF',
        onPress: () => {
          // Mock file selection
          setFormData(prev => ({
            ...prev,
            licenseFile: 'license-document.pdf'
          }));
        }
      }
    ]);
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

  const handleSubmit = () => {
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
    if (formData.requiresLicense && !formData.licenseFile) {
      Alert.alert('Error', t('createEvent.uploadLicenseRequired'));
      return;
    }

    // In a real app, this would save to backend
    console.log('Event created:', formData);
    Alert.alert('Success', 'Event created successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('createEvent.title')}</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.publishButton}>
          <Text style={styles.publishButtonText}>{t('createEvent.publish')}</Text>
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
              onPress={() => {
                // In a real app, this would open image picker
                Alert.alert('Image Upload', 'Image picker will be implemented with expo-image-picker');
              }}
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
          <View style={styles.dateButton}>
            <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            <TextInput
              style={styles.dateInput}
              value={formatDate(formData.date)}
              placeholder="Select date (e.g., Dec 15, 2025)"
              placeholderTextColor="#9ca3af"
              onChangeText={(text) => {
                // Simple date parsing - in production use a proper date picker
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  handleInputChange('date', date);
                }
              }}
            />
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.label}>
                {t('createEvent.startTime')} <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.dateButton}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.dateInput}
                  value={formatTime(formData.startTime)}
                  placeholder="Start time (e.g., 6:00 PM)"
                  placeholderTextColor="#9ca3af"
                  onChangeText={(text) => {
                    // Simple time parsing - in production use a proper time picker
                    const [time, period] = text.split(' ');
                    if (time) {
                      const [hours, minutes] = time.split(':');
                      const date = new Date();
                      let h = parseInt(hours) || 0;
                      if (period?.toLowerCase() === 'pm' && h < 12) h += 12;
                      if (period?.toLowerCase() === 'am' && h === 12) h = 0;
                      date.setHours(h, parseInt(minutes) || 0);
                      handleInputChange('startTime', date);
                    }
                  }}
                />
              </View>
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.label}>{t('createEvent.endTime')}</Text>
              <View style={styles.dateButton}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <TextInput
                  style={styles.dateInput}
                  value={formatTime(formData.endTime)}
                  placeholder="End time (e.g., 11:00 PM)"
                  placeholderTextColor="#9ca3af"
                  onChangeText={(text) => {
                    // Simple time parsing - in production use a proper time picker
                    const [time, period] = text.split(' ');
                    if (time) {
                      const [hours, minutes] = time.split(':');
                      const date = new Date();
                      let h = parseInt(hours) || 0;
                      if (period?.toLowerCase() === 'pm' && h < 12) h += 12;
                      if (period?.toLowerCase() === 'am' && h === 12) h = 0;
                      date.setHours(h, parseInt(minutes) || 0);
                      handleInputChange('endTime', date);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>

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
                <TextInput
                  style={[styles.input, styles.seatTypeNameInput]}
                  value={newSeatType.name}
                  onChangeText={(value) => setNewSeatType(prev => ({ ...prev, name: value }))}
                  placeholder={t('createEvent.seatTypeName')}
                  placeholderTextColor="#9ca3af"
                />
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
              trackColor={{ false: '#e5e7eb', true: '#000' }}
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
                    onPress={() => handleInputChange('licenseFile', null)}
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
              trackColor={{ false: '#e5e7eb', true: '#000' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('createEvent.allowGuests')}</Text>
            <Switch
              value={formData.allowGuests}
              onValueChange={(value) => handleInputChange('allowGuests', value)}
              trackColor={{ false: '#e5e7eb', true: '#000' }}
              thumbColor="#fff"
            />
          </View>
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
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
    backgroundColor: '#000',
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
  addSeatTypeButton: {
    backgroundColor: '#000',
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
    color: '#374151',
  },
  removeLicenseButton: {
    padding: 4,
  },
});

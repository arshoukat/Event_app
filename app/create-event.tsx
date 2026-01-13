import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import { decode } from 'base-64';
import Toast from 'react-native-toast-message';
import { LanguageToggle } from '../components/LanguageToggle';

// Conditionally import ImagePicker
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.warn('expo-image-picker not available:', e);
}

// Conditionally import DocumentPicker
let DocumentPicker: any = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  console.warn('expo-document-picker not available:', e);
}

// Conditionally import DateTimePicker only on native platforms
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    // Import the datetimepicker module - Metro will automatically resolve
    // the platform-specific file (datetimepicker.ios.js or datetimepicker.android.js)
    const pickerModule = require('@react-native-community/datetimepicker');
    // The module exports the component as default
    DateTimePicker = pickerModule?.default || pickerModule;
    
    // Verify it's not the fallback implementation
    if (DateTimePicker && typeof DateTimePicker === 'function') {
      // Check if it's the fallback (returns null) by testing a render
      // This is a workaround to ensure we have the real component
      console.log('DateTimePicker loaded successfully for', Platform.OS);
    }
  } catch (e: any) {
    console.warn('DateTimePicker module not available:', e);
    DateTimePicker = null;
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
    startDate: new Date(),
    endDate: new Date(),
    startTime: new Date(),
    location: '',
    venue: '',
    eventType: 'in-person' as 'in-person' | 'online',
    capacity: '',
    maxAttendees: '',
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
  const [coverImage, setCoverImage] = useState('');
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [licenseFileUri, setLicenseFileUri] = useState<string | null>(null);
  const [newSeatType, setNewSeatType] = useState({ name: '', price: '' });
  const [showSeatTypePicker, setShowSeatTypePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  
  // Field errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  // Function to fetch user profile and extract IBAN
  const fetchUserIBAN = async (): Promise<string | null> => {
    try {
      // Get user profile from API (using the same endpoint as profile screen)
      const response = await apiService.get<{
        success?: boolean;
        data?: { 
          iban?: string;
          _id?: string;
          name?: string;
          email?: string;
          phone?: string;
          bio?: string;
        };
        iban?: string;
        _id?: string;
        name?: string;
        email?: string;
        phone?: string;
        bio?: string;
      }>('/users/profile');
      
      console.log('[CreateEvent] Profile response:', JSON.stringify(response, null, 2));
      
      // Handle different response formats
      let userData: any = null;
      if (response && typeof response === 'object') {
        if ('success' in response && 'data' in response) {
          userData = (response as { success: boolean; data: any }).data;
        } else if ('data' in response) {
          userData = (response as { data: any }).data;
        } else {
          userData = response;
        }
      }
      
      console.log('[CreateEvent] Extracted userData:', JSON.stringify(userData, null, 2));
      
      if (userData && userData.iban) {
        let ibanValue = userData.iban.trim();
        const originalIBAN = ibanValue;
        
        // IBAN format: 2 letters + 2 digits + alphanumeric (typically 15-34 chars total)
        const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
        const cleanedIBAN = ibanValue.replace(/\s/g, '').toUpperCase();
        
        // Check if it already matches IBAN format (already decoded)
        if (ibanRegex.test(cleanedIBAN)) {
          console.log('[CreateEvent] IBAN is already in correct format:', ibanValue);
          return ibanValue;
        }
        
        // If it doesn't match IBAN format, it's likely base64 encoded - try to decode it
        try {
          // Remove any whitespace before decoding
          const ibanToDecode = ibanValue.replace(/\s/g, '');
          const decoded = decode(ibanToDecode);
          console.log('[CreateEvent] Attempted to decode IBAN. Original:', originalIBAN, 'Decoded:', decoded);
          
          if (decoded && decoded.trim().length > 0) {
            // Clean and check decoded value
            const decodedCleaned = decoded.trim().replace(/\s/g, '').toUpperCase();
            
            // Check if decoded value looks like an IBAN
            if (ibanRegex.test(decodedCleaned)) {
              // Use decoded value if it matches IBAN format
              ibanValue = decodedCleaned;
              console.log('[CreateEvent] Successfully decoded IBAN from base64:', ibanValue);
            } else {
              // Even if it doesn't match format perfectly, use decoded if it has reasonable length
              // (some IBANs might have slightly different formats)
              if (decodedCleaned.length >= 10 && decodedCleaned.length <= 34 && /^[A-Z0-9]+$/.test(decodedCleaned)) {
                ibanValue = decodedCleaned;
                console.log('[CreateEvent] Using decoded value (alphanumeric check passed):', ibanValue);
              } else {
                console.log('[CreateEvent] Decoded value seems invalid, using original');
              }
            }
          }
        } catch (decodeError) {
          console.error('[CreateEvent] Failed to decode IBAN, might not be base64:', decodeError);
          console.log('[CreateEvent] Using original IBAN value:', originalIBAN);
          // If decode fails, return original value
        }
        
        console.log('[CreateEvent] Final IBAN value:', ibanValue);
        return ibanValue;
      }
      
      // Fallback: Check if IBAN is stored in AsyncStorage from login
      try {
        const storedUser = await storageService.getUser();
        if (storedUser && storedUser.iban) {
          let storedIBAN = storedUser.iban;
          
          // Try to decode if it looks encoded
          const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
          const cleanedStored = storedIBAN.replace(/\s/g, '').toUpperCase();
          
          if (!ibanRegex.test(cleanedStored)) {
            try {
              const decoded = decode(storedIBAN);
              console.log('[CreateEvent] Decoded IBAN from stored user data');
              storedIBAN = decoded;
            } catch (decodeError) {
              console.log('[CreateEvent] Stored IBAN is not base64 encoded');
            }
          }
          
          console.log('[CreateEvent] Found IBAN in stored user data:', storedIBAN);
          return storedIBAN;
        }
      } catch (storageError) {
        console.log('[CreateEvent] Could not check stored user data:', storageError);
      }
      
      console.log('[CreateEvent] No IBAN found in profile or storage');
      return null;
    } catch (error) {
      console.error('[CreateEvent] Failed to fetch user IBAN:', error);
      return null;
    }
  };

  // Auto-populate IBAN when screen loads (if user has saved IBAN from previous event)
  useEffect(() => {
    const loadUserIBAN = async () => {
      const savedIBAN = await fetchUserIBAN();
      if (savedIBAN) {
        setFormData(prev => ({
          ...prev,
          iban: savedIBAN
        }));
      }
    };
    
    loadUserIBAN();
  }, []);

  const handleInputChange = (field: string, value: string | boolean | Date | null) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Clear location and venue when switching to online mode
      if (field === 'eventType' && value === 'online' && prev.eventType === 'in-person') {
        updated.location = '';
        updated.venue = '';
        // Clear location error when switching event types
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.location;
          return newErrors;
        });
      }
      
      // When switching to paid, fetch user IBAN and auto-populate if available
      if (field === 'isPaid' && value === true && !prev.isPaid) {
        // Fetch IBAN asynchronously and update formData
        fetchUserIBAN().then(iban => {
          if (iban) {
            setFormData(current => ({
              ...current,
              iban: iban
            }));
            // Clear IBAN error if auto-populated
            setErrors(prevErrors => {
              const newErrors = { ...prevErrors };
              delete newErrors.iban;
              return newErrors;
            });
          }
        }).catch(error => {
          console.error('[CreateEvent] Error fetching user IBAN:', error);
          // Silently fail - user can still enter IBAN manually
        });
      }
      
      // Clear error for this field when user types
      if (touched[field] && errors[field]) {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      }
      
      return updated;
    });
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

  // Function to clean IBAN (remove spaces and convert to uppercase)
  const cleanIBAN = (iban: string): string => {
    // Remove spaces and convert to uppercase (backend will handle validation)
    return iban.replace(/\s/g, '').toUpperCase();
  };

  // IBAN validation function
  const validateIBAN = (iban: string): boolean => {
    // Basic IBAN validation (2 letters + 2 digits + up to 30 alphanumeric)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    return ibanRegex.test(cleaned);
  };

  // Comprehensive form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Event title must be at least 3 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Event description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    // Date validation
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    } else if (startDate < now) {
      newErrors.startDate = 'Start date must be today or in the future';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else {
      const endDate = new Date(formData.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after or equal to start date';
      }
    }

    // Time validation
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Location validation (based on event type)
    if (formData.eventType === 'in-person') {
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required for in-person events';
      }
    } else if (formData.eventType === 'online') {
      if (!formData.location.trim()) {
        newErrors.location = 'Online link is required for online events';
      } else {
        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        if (!urlPattern.test(formData.location.trim())) {
          newErrors.location = 'Please enter a valid URL';
        }
      }
    }

    // Capacity validation (if provided)
    if (formData.capacity.trim()) {
      const capacityNum = parseInt(formData.capacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        newErrors.capacity = 'Capacity must be a positive number';
      }
    }

    // Max Attendees validation (if provided, only for private events)
    if (formData.visibility === 'private' && formData.maxAttendees.trim()) {
      const maxAttendeesNum = parseInt(formData.maxAttendees);
      if (isNaN(maxAttendeesNum) || maxAttendeesNum <= 0) {
        newErrors.maxAttendees = 'Max attendees must be a positive number';
      }
    }

    // Paid event validations
    if (formData.isPaid) {
      // IBAN validation
      if (!formData.iban.trim()) {
        newErrors.iban = 'IBAN number is required for paid events';
      } else if (!validateIBAN(formData.iban)) {
        newErrors.iban = 'Please enter a valid IBAN number (format: 2 letters + 2 digits + 4-30 alphanumeric)';
      }

      // Seat types validation
      if (formData.seatTypes.length === 0) {
        newErrors.seatTypes = 'At least one seat type is required for paid events';
      } else {
        // Validate each seat type
        formData.seatTypes.forEach((seatType, index) => {
          const priceNum = parseFloat(seatType.price);
          if (isNaN(priceNum) || priceNum <= 0) {
            newErrors[`seatType_${index}`] = 'Seat type price must be a positive number';
          }
        });
      }
    }

    // License file validation
    if (formData.requiresLicense && !formData.licenseFile) {
      newErrors.licenseFile = 'License file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Mark field as touched
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    // Validate single field on blur
    validateSingleField(field);
  };

  // Validate single field
  const validateSingleField = (field: string) => {
    const newErrors: Record<string, string> = { ...errors };

    switch (field) {
      case 'title':
        if (!formData.title.trim()) {
          newErrors.title = 'Event title is required';
        } else if (formData.title.trim().length < 3) {
          newErrors.title = 'Event title must be at least 3 characters';
        } else {
          delete newErrors.title;
        }
        break;
      case 'description':
        if (!formData.description.trim()) {
          newErrors.description = 'Event description is required';
        } else if (formData.description.trim().length < 10) {
          newErrors.description = 'Description must be at least 10 characters';
        } else {
          delete newErrors.description;
        }
        break;
      case 'category':
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        } else {
          delete newErrors.category;
        }
        break;
      case 'location':
        if (formData.eventType === 'in-person' && !formData.location.trim()) {
          newErrors.location = 'Location is required for in-person events';
        } else if (formData.eventType === 'online' && !formData.location.trim()) {
          newErrors.location = 'Online link is required for online events';
        } else if (formData.eventType === 'online' && formData.location.trim()) {
          const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
          if (!urlPattern.test(formData.location.trim())) {
            newErrors.location = 'Please enter a valid URL';
          } else {
            delete newErrors.location;
          }
        } else {
          delete newErrors.location;
        }
        break;
      case 'iban':
        if (formData.isPaid) {
          if (!formData.iban.trim()) {
            newErrors.iban = 'IBAN number is required for paid events';
          } else if (!validateIBAN(formData.iban)) {
            newErrors.iban = 'Please enter a valid IBAN number';
          } else {
            delete newErrors.iban;
          }
        }
        break;
      case 'capacity':
        if (formData.capacity.trim()) {
          const capacityNum = parseInt(formData.capacity);
          if (isNaN(capacityNum) || capacityNum <= 0) {
            newErrors.capacity = 'Capacity must be a positive number';
          } else {
            delete newErrors.capacity;
          }
        } else {
          delete newErrors.capacity;
        }
        break;
      case 'maxAttendees':
        if (formData.visibility === 'private' && formData.maxAttendees.trim()) {
          const maxAttendeesNum = parseInt(formData.maxAttendees);
          if (isNaN(maxAttendeesNum) || maxAttendeesNum <= 0) {
            newErrors.maxAttendees = 'Max attendees must be a positive number';
          } else {
            delete newErrors.maxAttendees;
          }
        } else {
          delete newErrors.maxAttendees;
        }
        break;
      case 'seatTypes':
        if (formData.isPaid && formData.seatTypes.length === 0) {
          newErrors.seatTypes = 'At least one seat type is required for paid events';
        } else {
          delete newErrors.seatTypes;
        }
        break;
      case 'licenseFile':
        if (formData.requiresLicense && !formData.licenseFile) {
          newErrors.licenseFile = 'License file is required';
        } else {
          delete newErrors.licenseFile;
        }
        break;
      case 'startDate':
      case 'endDate':
      case 'startTime':
        // Date/time validation is handled in validateForm
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (field === 'startDate') {
          const startDate = new Date(formData.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
          } else if (startDate < now) {
            newErrors.startDate = 'Start date must be today or in the future';
          } else {
            delete newErrors.startDate;
          }
        } else if (field === 'endDate') {
          const startDate = new Date(formData.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(formData.endDate);
          endDate.setHours(0, 0, 0, 0);
          if (!formData.endDate) {
            newErrors.endDate = 'End date is required';
          } else if (endDate < startDate) {
            newErrors.endDate = 'End date must be after or equal to start date';
          } else {
            delete newErrors.endDate;
          }
        } else if (field === 'startTime') {
          if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
          } else {
            delete newErrors.startTime;
          }
        }
        break;
    }

    setErrors(newErrors);
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
    // Revalidate seat types after removal
    handleBlur('seatTypes');
  };

  const handleLicenseUpload = async () => {
    try {
      if (!DocumentPicker) {
        Alert.alert(
          'Document Picker Not Available',
          'The document picker module is not available. Please restart the Expo development server and try again.\n\nRun: npm start (or expo start)',
          [{ text: 'OK' }]
        );
        return;
      }

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
      if (!ImagePicker) {
        Alert.alert(
          'Image Picker Not Available',
          'The image picker module is not available. Please restart the Expo development server and try again.\n\nRun: npm start (or expo start)',
          [{ text: 'OK' }]
        );
        return;
      }

      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
          return;
        }
      }

      // Launch image picker - DON'T enable base64, we'll send as file buffer
      // Note: mediaTypes omitted - images is the default, which avoids casting issues
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [16, 9], // Standard cover image aspect ratio
        quality: 0.8,
        base64: false, // Don't encode to base64 - we'll send as file
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setCoverImage(selectedImage.uri);
        // Store the image URI for FormData upload (reusing coverImageBase64 state to store URI)
        setCoverImageBase64(selectedImage.uri);
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
    // Mark all fields as touched to show all errors
    const allFields = ['title', 'description', 'category', 'startDate', 'endDate', 'startTime', 'location', 'capacity', 'iban', 'seatTypes', 'licenseFile'];
    const touchedFields: Record<string, boolean> = {};
    allFields.forEach(field => {
      touchedFields[field] = true;
    });
    setTouched(touchedFields);

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
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

      // Combine startDate and startTime into ISO format for event start datetime
      const eventStartDate = new Date(formData.startDate);
      const startTimeDate = new Date(formData.startTime);
      eventStartDate.setHours(startTimeDate.getHours());
      eventStartDate.setMinutes(startTimeDate.getMinutes());
      eventStartDate.setSeconds(0);
      eventStartDate.setMilliseconds(0);
      
      // Combine endDate and startTime into ISO format for event end datetime
      const eventEndDate = new Date(formData.endDate);
      eventEndDate.setHours(startTimeDate.getHours());
      eventEndDate.setMinutes(startTimeDate.getMinutes());
      eventEndDate.setSeconds(0);
      eventEndDate.setMilliseconds(0);
      
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

      // Prepare event data according to API format (without imageUrl - will be sent separately)
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: eventStartDate.toISOString(), // Start date combined with start time
        endDate: eventEndDate.toISOString(), // End date combined with start time
        startTime: eventStartDate.toISOString(), // Start datetime (for backward compatibility)
        location: formData.location.trim() || formData.venue.trim(),
        venue: formData.venue.trim() || undefined, // Venue field
        category: formData.category,
        price: price, // Now an array of seat types with prices
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        maxAttendees: formData.visibility === 'private' && formData.maxAttendees.trim() ? parseInt(formData.maxAttendees) : undefined,
        status: 'published', // You can change this to 'draft' if needed
        tags: formData.tags, // Tags array
        visibility: formData.visibility, // Privacy/visibility field
        licenseFile: formData.requiresLicense && formData.licenseFile ? formData.licenseFile : undefined, // License file if required
        iban: formData.isPaid ? cleanIBAN(formData.iban) : undefined, // Cleaned IBAN for paid events (backend handles validation)
      };

      console.log('Event data being sent:', eventData);
      console.log('Cover image URI:', coverImage);

      // If there's a cover image, send it as FormData (multipart/form-data)
      if (coverImage && coverImageBase64) {
        // Create FormData for multipart/form-data upload
        const formDataToSend = new FormData();
        
        // Add all event data as JSON string (backend will parse this)
        formDataToSend.append('eventData', JSON.stringify(eventData));
        
        // Add the image file
        const imageUri = coverImageBase64;
        const filename = imageUri.split('/').pop() || 'cover-image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        // For React Native, FormData file format
        formDataToSend.append('coverImage', {
          uri: imageUri,
          type: type,
          name: filename,
        } as any);

        console.log('Sending event with image as FormData');

        // Get API URL and token
        // Access the private method via type assertion (since getBaseUrl is private)
        const apiServiceInternal = apiService as any;
        const baseUrl = process.env.EXPO_PUBLIC_API_URL || apiServiceInternal.getBaseUrl();
        const token = await storageService.getToken();
        
        // Ensure baseUrl has /api suffix
        const apiBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
        const url = `${apiBaseUrl}/events`;
        
        console.log('Uploading to:', url);

        // Send FormData request
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            // Don't set Content-Type - fetch will set it automatically with boundary for FormData
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {
            const text = await response.text().catch(() => '');
            if (text) errorMessage = text;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Event created successfully:', result);
        
        // Save IBAN to user profile if this is a paid event (for future use)
        if (formData.isPaid && formData.iban) {
          try {
            await apiService.put('/users/profile', {
              iban: formData.iban.trim()
            });
            console.log('[CreateEvent] IBAN saved to user profile');
          } catch (ibanError) {
            console.error('[CreateEvent] Failed to save IBAN to profile:', ibanError);
            // Don't fail the event creation if IBAN save fails
          }
        }
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event created successfully',
          visibilityTime: 10000,
        });

        // Redirect to home after a short delay
        setTimeout(() => {
          router.replace('/home?eventCreated=true');
        }, 1000);
      } else {
        // No image, send as JSON (existing method)
        
        console.log('Creating event without image as JSON:', eventData);
        
        const result = await apiService.post('/events', eventData);
        console.log('Event created successfully:', result);
        
        // Save IBAN to user profile if this is a paid event (for future use)
        if (formData.isPaid && formData.iban) {
          try {
            await apiService.put('/users/profile', {
              iban: formData.iban.trim()
            });
            console.log('[CreateEvent] IBAN saved to user profile');
          } catch (ibanError) {
            console.error('[CreateEvent] Failed to save IBAN to profile:', ibanError);
            // Don't fail the event creation if IBAN save fails
          }
        }
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Event created successfully',
          visibilityTime: 10000,
        });

        // Redirect to home after a short delay
        setTimeout(() => {
          router.replace('/home?eventCreated=true');
        }, 1000);
      }
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
        <View style={styles.headerRight}>
          <LanguageToggle />
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
            style={[styles.input, (touched.title && errors.title) ? styles.inputError : undefined]}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            onBlur={() => handleBlur('title')}
            placeholder={t('createEvent.eventTitlePlaceholder')}
            placeholderTextColor="#9ca3af"
          />
          {touched.title && errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {t('createEvent.description')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, (touched.description && errors.description) ? styles.inputError : undefined]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            onBlur={() => handleBlur('description')}
            placeholder={t('createEvent.descriptionPlaceholder')}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {touched.description && errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.label}>
                {t('Start Date') || 'Start Date'} <Text style={styles.required}>*</Text>
              </Text>
              {Platform.OS === 'web' || !DateTimePicker ? (
                <View style={[styles.dateButton, (touched.startDate && errors.startDate) ? styles.inputError : undefined]}>
                  <Ionicons name="calendar-outline" size={20} color={touched.startDate && errors.startDate ? "#ef4444" : "#6b7280"} />
                  <TextInput
                    style={styles.dateInput}
                    // @ts-ignore - type is supported on react-native-web
                    type="date"
                    value={formatDateForInput(formData.startDate)}
                    // @ts-ignore - onChange is supported on react-native-web
                    onChange={(e: any) => {
                      const dateValue = e?.target?.value || e?.nativeEvent?.text || '';
                      if (!dateValue) return;
                      const date = new Date(dateValue);
                      if (!isNaN(date.getTime())) {
                        handleInputChange('startDate', date);
                        handleBlur('startDate');
                      }
                    }}
                    onBlur={() => handleBlur('startDate')}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.dateButton, (touched.startDate && errors.startDate) ? styles.inputError : undefined]}
                  onPress={() => {
                      console.log('Start date picker button pressed, opening picker...');
                      setShowStartDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={touched.startDate && errors.startDate ? "#ef4444" : "#6b7280"} />
                  <Text style={styles.dateInput}>
                    {formatDate(formData.startDate)}
                  </Text>
                </TouchableOpacity>
              )}
              {touched.startDate && errors.startDate && (
                <Text style={styles.errorText}>{errors.startDate}</Text>
              )}
            </View>

            <View style={styles.timeColumn}>
              <Text style={styles.label}>
                {t('End Date') || 'End Date'} <Text style={styles.required}>*</Text>
              </Text>
              {Platform.OS === 'web' || !DateTimePicker ? (
                <View style={[styles.dateButton, (touched.endDate && errors.endDate) ? styles.inputError : undefined]}>
                  <Ionicons name="calendar-outline" size={20} color={touched.endDate && errors.endDate ? "#ef4444" : "#6b7280"} />
                  <TextInput
                    style={styles.dateInput}
                    // @ts-ignore - type is supported on react-native-web
                    type="date"
                    value={formatDateForInput(formData.endDate)}
                    // @ts-ignore - onChange is supported on react-native-web
                    onChange={(e: any) => {
                      const dateValue = e?.target?.value || e?.nativeEvent?.text || '';
                      if (!dateValue) return;
                      const date = new Date(dateValue);
                      if (!isNaN(date.getTime())) {
                        handleInputChange('endDate', date);
                        handleBlur('endDate');
                      }
                    }}
                    onBlur={() => handleBlur('endDate')}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.dateButton, (touched.endDate && errors.endDate) ? styles.inputError : undefined]}
                  onPress={() => {
                      console.log('End date picker button pressed, opening picker...');
                      setShowEndDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color={touched.endDate && errors.endDate ? "#ef4444" : "#6b7280"} />
                  <Text style={styles.dateInput}>
                    {formatDate(formData.endDate)}
                  </Text>
                </TouchableOpacity>
              )}
              {touched.endDate && errors.endDate && (
                <Text style={styles.errorText}>{errors.endDate}</Text>
              )}
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <Text style={styles.label}>
                {t('createEvent.startTime')} <Text style={styles.required}>*</Text>
              </Text>
              {Platform.OS === 'web' || !DateTimePicker ? (
                <View style={[styles.dateButton, (touched.startTime && errors.startTime) ? styles.inputError : undefined]}>
                  <Ionicons name="time-outline" size={20} color={touched.startTime && errors.startTime ? "#ef4444" : "#6b7280"} />
                  <TextInput
                    style={styles.dateInput}
                    // @ts-ignore - type is supported on react-native-web
                    type="time"
                    value={formatTimeForInput(formData.startTime)}
                    // @ts-ignore - onChange is supported on react-native-web
                    onChange={(e: any) => {
                      const timeValue = e?.target?.value || e?.nativeEvent?.text || '';
                      if (!timeValue) return;
                      const [hours, minutes] = timeValue.split(':');
                      const date = new Date();
                      date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
                      handleInputChange('startTime', date);
                      handleBlur('startTime');
                    }}
                    onBlur={() => handleBlur('startTime')}
                  />
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.dateButton, (touched.startTime && errors.startTime) ? styles.inputError : undefined]}
                  onPress={() => {
                      setShowStartTimePicker(true);
                  }}
                >
                  <Ionicons name="time-outline" size={20} color={touched.startTime && errors.startTime ? "#ef4444" : "#6b7280"} />
                  <Text style={styles.dateInput}>
                    {formatTime(formData.startTime)}
                  </Text>
                </TouchableOpacity>
              )}
              {touched.startTime && errors.startTime && (
                <Text style={styles.errorText}>{errors.startTime}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Start Date Picker Modal */}
        {Platform.OS !== 'web' && DateTimePicker && showStartDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              visible={showStartDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowStartDatePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowStartDatePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Start Date</Text>
                    <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.startDate}
                    mode="date"
                    display="spinner"
                    onChange={(event: any, selectedDate?: Date) => {
                      console.log('Start date picker onChange:', event.type, selectedDate);
                      if (event.type === 'set' && selectedDate) {
                        handleInputChange('startDate', selectedDate);
                        setTouched(prev => ({ ...prev, startDate: true }));
                        validateSingleField('startDate');
                      }
                    }}
                    minimumDate={new Date()}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={formData.startDate}
              mode="date"
              display="spinner"
              onChange={(event: any, selectedDate?: Date) => {
                console.log('Android start date picker onChange:', event.type, selectedDate);
                if (Platform.OS === 'android') {
                  setShowStartDatePicker(false);
                }
                if (event.type === 'set' && selectedDate) {
                  handleInputChange('startDate', selectedDate);
                  setTouched(prev => ({ ...prev, startDate: true }));
                  validateSingleField('startDate');
                } else if (event.type === 'dismissed') {
                  setShowStartDatePicker(false);
                }
              }}
              minimumDate={new Date()}
            />
          )
        )}

        {/* End Date Picker Modal */}
        {Platform.OS !== 'web' && DateTimePicker && showEndDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal
              visible={showEndDatePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowEndDatePicker(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowEndDatePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select End Date</Text>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.endDate}
                    mode="date"
                    display="spinner"
                    onChange={(event: any, selectedDate?: Date) => {
                      console.log('End date picker onChange:', event.type, selectedDate);
                      if (event.type === 'set' && selectedDate) {
                        handleInputChange('endDate', selectedDate);
                        setTouched(prev => ({ ...prev, endDate: true }));
                        validateSingleField('endDate');
                      }
                    }}
                    minimumDate={formData.startDate}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={formData.endDate}
              mode="date"
              display="spinner"
              onChange={(event: any, selectedDate?: Date) => {
                console.log('Android end date picker onChange:', event.type, selectedDate);
                if (Platform.OS === 'android') {
                  setShowEndDatePicker(false);
                }
                if (event.type === 'set' && selectedDate) {
                  handleInputChange('endDate', selectedDate);
                  setTouched(prev => ({ ...prev, endDate: true }));
                  validateSingleField('endDate');
                } else if (event.type === 'dismissed') {
                  setShowEndDatePicker(false);
                }
              }}
              minimumDate={formData.startDate}
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
                        setTouched(prev => ({ ...prev, startTime: true }));
                        validateSingleField('startTime');
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
              display="spinner"
              is24Hour={false}
              onChange={(event: any, selectedTime?: Date) => {
                console.log('Android start time picker onChange:', event.type, selectedTime);
                if (Platform.OS === 'android') {
                  setShowStartTimePicker(false);
                }
                if (event.type === 'set' && selectedTime) {
                  handleInputChange('startTime', selectedTime);
                  setTouched(prev => ({ ...prev, startTime: true }));
                  validateSingleField('startTime');
                } else if (event.type === 'dismissed') {
                  setShowStartTimePicker(false);
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
                style={[styles.input, (touched.location && errors.location) ? styles.inputError : undefined]}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                onBlur={() => handleBlur('location')}
                placeholder={t('createEvent.locationPlaceholder')}
                placeholderTextColor="#9ca3af"
              />
              {touched.location && errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
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
            <Text style={styles.label}>
              {t('createEvent.onlineLink')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, (touched.location && errors.location) ? styles.inputError : undefined]}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
              onBlur={() => handleBlur('location')}
              placeholder={t('createEvent.onlineLinkPlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="url"
            />
            {touched.location && errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
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
                  formData.category === cat.value && styles.categoryButtonActive,
                  (touched.category && errors.category && formData.category !== cat.value) ? styles.categoryButtonError : undefined
                ]}
                onPress={() => {
                  handleInputChange('category', cat.value);
                  handleBlur('category');
                }}
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
          {touched.category && errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('createEvent.capacity')}</Text>
          <TextInput
            style={[styles.input, (touched.capacity && errors.capacity) ? styles.inputError : undefined]}
            value={formData.capacity}
            onChangeText={(value) => handleInputChange('capacity', value)}
            onBlur={() => handleBlur('capacity')}
            placeholder={t('createEvent.capacityPlaceholder')}
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
          {touched.capacity && errors.capacity && (
            <Text style={styles.errorText}>{errors.capacity}</Text>
          )}
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
              style={[styles.input, (touched.iban && errors.iban) ? styles.inputError : undefined]}
              value={formData.iban}
              onChangeText={(value) => handleInputChange('iban', value)}
              onBlur={() => handleBlur('iban')}
              placeholder="Enter your IBAN number"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {touched.iban && errors.iban ? (
              <Text style={styles.errorText}>{errors.iban}</Text>
            ) : (
              <Text style={styles.hintText}>
                Format: 2 letters + 2 digits + up to 30 alphanumeric characters
              </Text>
            )}
          </View>
        )}

        {/* Payment Structure (if Paid) */}
        {formData.isPaid && (
          <View style={styles.section}>
            <Text style={styles.label}>
              {t('createEvent.seatType')} <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.hintText}>{t('createEvent.seatTypeHint')}</Text>
            
            {/* Existing Seat Types */}
            {formData.seatTypes.length > 0 && (
              <View style={styles.seatTypesContainer}>
                {formData.seatTypes.map((seatType, index) => (
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
            {touched.seatTypes && errors.seatTypes && (
              <Text style={styles.errorText}>{errors.seatTypes}</Text>
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
                    {newSeatType.name || t('createEvent.seatTypePlaceholder') || 'Select Seat Type'}
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
            <>
              <View style={styles.licenseUploadContainer}>
                {formData.licenseFile ? (
                  <View style={[styles.licenseFileContainer, (touched.licenseFile && errors.licenseFile) ? styles.inputError : undefined]}>
                    <Ionicons name="document-text-outline" size={24} color="#6b7280" />
                    <Text style={styles.licenseFileName}>{formData.licenseFile}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        handleInputChange('licenseFile', null);
                        setLicenseFileUri(null);
                        handleBlur('licenseFile');
                      }}
                      style={styles.removeLicenseButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.licenseUploadButton, (touched.licenseFile && errors.licenseFile) ? styles.inputError : undefined]}
                    onPress={() => {
                      handleLicenseUpload();
                      handleBlur('licenseFile');
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color={touched.licenseFile && errors.licenseFile ? "#ef4444" : "#6b7280"} />
                    <Text style={[styles.licenseUploadText, (touched.licenseFile && errors.licenseFile) ? { color: '#ef4444' } : undefined]}>{t('createEvent.uploadLicense')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {touched.licenseFile && errors.licenseFile && (
                <Text style={styles.errorText}>{errors.licenseFile}</Text>
              )}
            </>
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

          {/* Max Attendees (only for private events) */}
          {formData.visibility === 'private' && (
            <View style={styles.section}>
              <Text style={styles.label}>Max Attendees (Optional)</Text>
              <TextInput
                style={[styles.input, (touched.maxAttendees && errors.maxAttendees) ? styles.inputError : undefined]}
                value={formData.maxAttendees}
                onChangeText={(value) => handleInputChange('maxAttendees', value)}
                onBlur={() => handleBlur('maxAttendees')}
                placeholder="Enter maximum number of attendees"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
              />
              {touched.maxAttendees && errors.maxAttendees && (
                <Text style={styles.errorText}>{errors.maxAttendees}</Text>
              )}
            </View>
          )}

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  categoryButtonError: {
    borderColor: '#ef4444',
    borderWidth: 2,
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

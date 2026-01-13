import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Share, Linking, Clipboard, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Helper function to get base URL for images (API URL without /api)
const getImageBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
  }
  
  // For physical devices, try to detect IP
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:5001`;
      }
    }
  }
  
  // Default to localhost
  return 'http://localhost:5001';
};

// Helper function to get base share URL (for share links)
const getShareBaseUrl = (): string => {
  // If EXPO_PUBLIC_API_URL is set, use it (remove /api and add /share)
  if (process.env.EXPO_PUBLIC_API_URL) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/api$/, '');
    // Get port from API URL if available, otherwise use default port 5002
    const urlMatch = process.env.EXPO_PUBLIC_API_URL.match(/http:\/\/([^:]+):(\d+)/);
    if (urlMatch) {
      const host = urlMatch[1];
      const port = urlMatch[2];
      return `http://${host}:${port}`;
    }
    return baseUrl;
  }
  
  // For physical devices, try to detect IP
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        // Default to port 5002 for share links (backend port)
        return `http://${ip}:5002`;
      }
    }
  }
  
  // Default to localhost:5002 (backend port)
  return 'http://localhost:5002';
};

interface ApiEvent {
  _id?: string; // MongoDB ID
  id?: string | number; // Fallback for other formats
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  venue?: string;
  category: string;
  price: Array<{ name: string; price: number; _id?: string }> | number | string;
  imageUrl?: string | null;
  tags?: string[];
  attendees?: number | string[]; // Can be number or array
  capacity?: number;
  maxAttendees?: number;
  shareToken?: string;
  createdBy?: {
    _id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
  organizer?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
  visibility?: string;
  invitedEmails?: string[];
  licenseFile?: string | null;
  iban?: string;
  status?: string;
}

interface DisplayEvent {
  id: string | number; // Keep as string for MongoDB ObjectIds
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress: string;
  category: string;
  image: string;
  attendees: number;
  price: number | string;
  tags: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
    followers?: string;
  };
}

export default function EventDetailScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id, shareToken } = useLocalSearchParams();
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [originalEventData, setOriginalEventData] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');

  useEffect(() => {
    console.log('[EventDetail] useEffect triggered, id:', id, 'shareToken:', shareToken);
    if (shareToken) {
      // Fetch event via share token
      fetchEventByShareToken();
    } else if (id) {
      fetchEventDetails();
    } else {
      console.warn('[EventDetail] No ID or shareToken provided in URL params');
      setError('Event ID or share token is missing');
      setLoading(false);
    }
  }, [id, shareToken]);

  const fetchEventDetails = async () => {
    console.log('[EventDetail] fetchEventDetails called');
    console.log('[EventDetail] Raw id from params:', id);
    console.log('[EventDetail] id type:', typeof id);
    console.log('[EventDetail] id is array:', Array.isArray(id));
    
    // Validate ID - check if it exists and is not "undefined"
    if (!id || id === 'undefined' || id === 'null' || id === 'unknown') {
      console.error('[EventDetail] Invalid ID:', id);
      setError('Event ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Extract and validate event ID from URL parameters
      // useLocalSearchParams automatically decodes URL-encoded values
      let eventId: string;
      if (Array.isArray(id)) {
        eventId = String(id[0]); // Get first element if array
        console.log('[EventDetail] ID was array, extracted:', eventId);
      } else {
        eventId = String(id);
        console.log('[EventDetail] ID was string, using:', eventId);
      }

      // Additional validation - ensure it's a valid ID
      if (!eventId || eventId === 'undefined' || eventId === 'null' || eventId === 'unknown' || eventId === '') {
        console.error('[EventDetail] Invalid event ID after processing:', eventId);
        setError('Invalid event ID');
        setLoading(false);
        return;
      }

      console.log('[EventDetail] Fetching event details for ID:', eventId);
      console.log('[EventDetail] API endpoint will be: /events/' + eventId);

      // Fetch event from API - the ID is appended to the URL
      const response = await apiService.get<{ success: boolean; data: ApiEvent } | ApiEvent | { data: ApiEvent }>(`/events/${eventId}`);
      
      console.log('[EventDetail] Event details response received:', response);
      console.log('[EventDetail] Response type:', typeof response);
      console.log('[EventDetail] Response keys:', response ? Object.keys(response) : 'null');
      
      // Handle different response formats
      let eventData: ApiEvent;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        // Backend format: { success: true, data: {...} }
        eventData = (response as { success: boolean; data: ApiEvent }).data;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Alternative format: { data: {...} }
        eventData = (response as { data: ApiEvent }).data;
      } else if (Array.isArray(response)) {
        eventData = response[0];
      } else {
        eventData = response as ApiEvent;
      }
      
      // Use _id if id is not present (MongoDB format)
      if (!eventData.id && eventData._id) {
        eventData.id = eventData._id;
      }
      
      // Map createdBy to organizer if organizer is not present
      if (!eventData.organizer && eventData.createdBy) {
        eventData.organizer = {
          name: eventData.createdBy.name,
          email: eventData.createdBy.email,
          avatar: eventData.createdBy.avatar
        };
      }

      // Format date
      const eventDate = new Date(eventData.startTime || eventData.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Format time
      const startTime = new Date(eventData.startTime || eventData.date);
      const formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      let formattedEndTime = '';
      if (eventData.endTime) {
        const endTime = new Date(eventData.endTime);
        formattedEndTime = endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      const formattedTime = formattedEndTime 
        ? `${formattedStartTime} - ${formattedEndTime}`
        : formattedStartTime;

      // Format price
      let priceDisplay: number | string = 'Free';
      if (Array.isArray(eventData.price) && eventData.price.length > 0) {
        // If price is an array of seat types, show the minimum price
        const minPrice = Math.min(...eventData.price.map(p => p.price));
        priceDisplay = minPrice;
      } else if (typeof eventData.price === 'number') {
        priceDisplay = eventData.price;
      } else if (typeof eventData.price === 'string' && eventData.price !== 'Free') {
        priceDisplay = eventData.price;
      }

      // Get image URL - handle relative paths
      let imageUrl = '';
      if (eventData.imageUrl) {
        if (eventData.imageUrl.startsWith('data:image')) {
          // Base64 image
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('http://') || eventData.imageUrl.startsWith('https://')) {
          // Full URL
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('/')) {
          // Relative path - prepend base URL (without /api)
          const baseUrl = getImageBaseUrl();
          imageUrl = `${baseUrl}${eventData.imageUrl}`;
          console.log('Constructed image URL:', imageUrl);
        } else {
          imageUrl = eventData.imageUrl;
        }
      }

      // Handle attendees - can be number or array
      let attendeesCount = 0;
      if (typeof eventData.attendees === 'number') {
        attendeesCount = eventData.attendees;
      } else if (Array.isArray(eventData.attendees)) {
        attendeesCount = eventData.attendees.length;
      }

      // Transform to display format
      // Keep ID as string for MongoDB ObjectIds - do NOT convert to number
      const transformedEvent: DisplayEvent = {
        id: eventData.id ? String(eventData.id) : (eventData._id ? String(eventData._id) : ''),
        title: eventData.title,
        date: formattedDate,
        time: formattedTime,
        location: eventData.venue || eventData.location,
        fullAddress: eventData.location || eventData.venue || '',
        category: eventData.category,
        image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
        attendees: attendeesCount,
        price: priceDisplay,
        tags: eventData.tags || [],
        description: eventData.description || 'No description available.',
        host: {
          name: eventData.organizer?.name || eventData.createdBy?.name || 'Event Organizer',
          avatar: eventData.organizer?.avatar || eventData.createdBy?.avatar || 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NjUzMDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
          followers: '0'
        }
      };

      setEvent(transformedEvent);
      setOriginalEventData(eventData); // Store original event data for free event check
      
      // Check if current user is the creator
      const userIsCreator = await checkIfCreator(eventData);
      
      // Set share link based on event visibility
      const baseShareUrl = getShareBaseUrl();
      if (eventData.visibility === 'private') {
        if (userIsCreator && eventData.shareToken) {
          setShareLink(`${baseShareUrl}/share/${eventData.shareToken}`);
        }
      } else {
        const eventId = eventData._id || eventData.id;
        if (eventId) {
          setShareLink(`${baseShareUrl}/share/event-detail?id=${encodeURIComponent(String(eventId))}`);
        }
      }
    } catch (err: any) {
      console.error('[EventDetail] Failed to fetch event details:', err);
      console.error('[EventDetail] Error type:', typeof err);
      console.error('[EventDetail] Error message:', err?.message);
      console.error('[EventDetail] Error stack:', err?.stack);
      
      const errorMessage = err?.message || err?.toString() || 'Failed to load event details. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch event by share token
  const fetchEventByShareToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const tokenValue = Array.isArray(shareToken) ? String(shareToken[0]) : String(shareToken);
      
      if (!tokenValue || tokenValue === 'undefined' || tokenValue === 'null') {
        setError('Invalid share token');
        setLoading(false);
        return;
      }

      console.log('[EventDetail] Fetching event via share token:', tokenValue);

      // Fetch event via share token (public endpoint)
      const response = await apiService.get<{ success: boolean; data: ApiEvent } | ApiEvent | { data: ApiEvent }>(`/events/share/${tokenValue}`);
      
      // Handle response same as normal fetch
      let eventData: ApiEvent;
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        eventData = (response as { success: boolean; data: ApiEvent }).data;
      } else if (response && typeof response === 'object' && 'data' in response) {
        eventData = (response as { data: ApiEvent }).data;
      } else if (Array.isArray(response)) {
        eventData = response[0];
      } else {
        eventData = response as ApiEvent;
      }

      if (!eventData.id && eventData._id) {
        eventData.id = eventData._id;
      }

      if (!eventData.organizer && eventData.createdBy) {
        eventData.organizer = {
          name: eventData.createdBy.name,
          email: eventData.createdBy.email,
          avatar: eventData.createdBy.avatar
        };
      }

      // Format and transform event data (same as fetchEventDetails)
      const eventDate = new Date(eventData.startTime || eventData.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const startTime = new Date(eventData.startTime || eventData.date);
      const formattedStartTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      let formattedEndTime = '';
      if (eventData.endTime) {
        const endTime = new Date(eventData.endTime);
        formattedEndTime = endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }

      const formattedTime = formattedEndTime 
        ? `${formattedStartTime} - ${formattedEndTime}`
        : formattedStartTime;

      let priceDisplay: number | string = 'Free';
      if (Array.isArray(eventData.price) && eventData.price.length > 0) {
        const minPrice = Math.min(...eventData.price.map(p => p.price));
        priceDisplay = minPrice;
      } else if (typeof eventData.price === 'number') {
        priceDisplay = eventData.price;
      } else if (typeof eventData.price === 'string' && eventData.price !== 'Free') {
        priceDisplay = eventData.price;
      }

      let imageUrl = '';
      if (eventData.imageUrl) {
        if (eventData.imageUrl.startsWith('data:image')) {
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('http://') || eventData.imageUrl.startsWith('https://')) {
          imageUrl = eventData.imageUrl;
        } else if (eventData.imageUrl.startsWith('/')) {
          const baseUrl = getImageBaseUrl();
          imageUrl = `${baseUrl}${eventData.imageUrl}`;
        } else {
          imageUrl = eventData.imageUrl;
        }
      }

      let attendeesCount = 0;
      if (typeof eventData.attendees === 'number') {
        attendeesCount = eventData.attendees;
      } else if (Array.isArray(eventData.attendees)) {
        attendeesCount = eventData.attendees.length;
      }

      const transformedEvent: DisplayEvent = {
        id: eventData.id ? String(eventData.id) : (eventData._id ? String(eventData._id) : ''),
        title: eventData.title,
        date: formattedDate,
        time: formattedTime,
        location: eventData.venue || eventData.location,
        fullAddress: eventData.location || eventData.venue || '',
        category: eventData.category,
        image: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
        attendees: attendeesCount,
        price: priceDisplay,
        tags: eventData.tags || [],
        description: eventData.description || 'No description available.',
        host: {
          name: eventData.organizer?.name || eventData.createdBy?.name || 'Event Organizer',
          avatar: eventData.organizer?.avatar || eventData.createdBy?.avatar || 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NjUzMDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
          followers: '0'
        }
      };

      setEvent(transformedEvent);
      setOriginalEventData(eventData);
      
      // Check if creator
      const userIsCreator = await checkIfCreator(eventData);
      
      // Prepare share link
      const baseShareUrl = getShareBaseUrl();
      if (eventData.visibility === 'private') {
        if (userIsCreator && eventData.shareToken) {
          setShareLink(`${baseShareUrl}/share/${eventData.shareToken}`);
        } else if (shareToken) {
          const tokenValue = Array.isArray(shareToken) ? String(shareToken[0]) : String(shareToken);
          setShareLink(`${baseShareUrl}/share/${tokenValue}`);
        }
      } else {
        const eventId = eventData._id || eventData.id;
        if (eventId) {
          setShareLink(`${baseShareUrl}/share/event-detail?id=${encodeURIComponent(String(eventId))}`);
        }
      }
    } catch (err: any) {
      console.error('[EventDetail] Failed to fetch event via share token:', err);
      const errorMessage = err?.message || 'Invalid or expired share link. Please request a new one.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is the event creator
  const checkIfCreator = async (eventData: ApiEvent) => {
    try {
      const user = await storageService.getUser();
      if (user && user._id && eventData.createdBy?._id) {
        const creator = user._id === eventData.createdBy._id;
        setIsCreator(creator);
        return creator;
      } else {
        setIsCreator(false);
        return false;
      }
    } catch (err) {
      console.error('[EventDetail] Error checking creator:', err);
      setIsCreator(false);
      return false;
    }
  };

  // Get share link for private events (creator only)
  const fetchShareLinkFromAPI = async () => {
    if (!originalEventData || !isCreator) return;
    
    try {
      const eventId = originalEventData._id || originalEventData.id;
      if (!eventId) return;

      // If shareToken is already available, use it
      if (originalEventData.shareToken) {
        const baseShareUrl = getShareBaseUrl();
        setShareLink(`${baseShareUrl}/share/${originalEventData.shareToken}`);
        return;
      }

      // Fetch share link from API
      const response = await apiService.get<{ success: boolean; data: { shareToken: string; shareUrl: string } } | { shareToken: string; shareUrl: string }>(`/events/${eventId}/share-link`);
      
      let linkData: { shareToken: string; shareUrl: string };
      if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
        linkData = (response as { success: boolean; data: { shareToken: string; shareUrl: string } }).data;
      } else {
        linkData = response as { shareToken: string; shareUrl: string };
      }

      const baseShareUrl = getShareBaseUrl();
      // Use shareUrl from API if provided, otherwise construct it
      setShareLink(linkData.shareUrl || `${baseShareUrl}/share/${linkData.shareToken}`);
    } catch (err) {
      console.error('[EventDetail] Failed to fetch share link:', err);
    }
  };

  // Handle share button click
  const handleShareButton = async () => {
    if (!event || !originalEventData) return;

    let linkToShare = shareLink;

    // For private events, check permissions
    if (originalEventData.visibility === 'private') {
      if (!isCreator && !shareToken) {
        Alert.alert(
          'Private Event',
          'Only the event creator can share private events. Please contact the event organizer for the share link.',
          [{ text: 'OK' }]
        );
        return;
      }

      const baseShareUrl = getShareBaseUrl();
      
      // Prepare share link for private events
      if (!linkToShare) {
        if (originalEventData.visibility === 'private') {
          if (isCreator) {
            // Creator - try to fetch from API if not available
            if (originalEventData.shareToken) {
              linkToShare = `${baseShareUrl}/share/${originalEventData.shareToken}`;
            } else {
              // Fetch from API
              await fetchShareLinkFromAPI();
              linkToShare = shareLink; // Use updated shareLink after fetch
            }
          } else if (shareToken) {
            // Non-creator with share token
            const tokenValue = Array.isArray(shareToken) ? String(shareToken[0]) : String(shareToken);
            linkToShare = `${baseShareUrl}/share/${tokenValue}`;
          }
        } else {
          // Public event - use regular event link
          const eventId = originalEventData._id || originalEventData.id;
          if (eventId) {
            linkToShare = `${baseShareUrl}/share/event-detail?id=${encodeURIComponent(String(eventId))}`;
          }
        }
      }
    } else {
      // Public event - use regular event link
      if (!linkToShare) {
        const baseShareUrl = getShareBaseUrl();
        const eventId = originalEventData._id || originalEventData.id;
        if (eventId) {
          linkToShare = `${baseShareUrl}/share/event-detail?id=${encodeURIComponent(String(eventId))}`;
        }
      }
    }

    // Set share link if we have one
    if (linkToShare && linkToShare !== shareLink) {
      setShareLink(linkToShare);
    }

    // Only show modal if we have a share link
    if (linkToShare) {
      setShowShareModal(true);
    } else {
      Alert.alert('Error', 'Unable to generate share link. Please try again.');
    }
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    if (shareLink) {
      Clipboard.setString(shareLink);
      Alert.alert('Success', 'Share link copied to clipboard');
      setShowShareModal(false);
    }
  };

  // Share via Email
  const handleShareEmail = async () => {
    if (!shareLink || !event) return;

    try {
      const subject = originalEventData?.visibility === 'private'
        ? `Invitation to ${event.title}`
        : `Check out ${event.title}`;
      const body = originalEventData?.visibility === 'private'
        ? `You're invited to join my private event: ${event.title}\n\nJoin here: ${shareLink}`
        : `Check out this event: ${event.title}\n\n${shareLink}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        // Fallback to native share
        await Share.share({
          message: body,
        });
      }
      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to share via email:', err);
      // Fallback to native share
      try {
        const body = originalEventData?.visibility === 'private'
          ? `You're invited to join my private event: ${event.title}\n\nJoin here: ${shareLink}`
          : `Check out this event: ${event.title}\n\n${shareLink}`;
        await Share.share({
          message: body,
        });
        setShowShareModal(false);
      } catch (shareErr) {
        Alert.alert('Error', 'Unable to share. Please copy the link manually.');
      }
    }
  };

  // Share via native share (More)
  const handleShareNative = async () => {
    if (!shareLink || !event) return;

    try {
      const message = originalEventData?.visibility === 'private'
        ? `Join my private event: ${event.title}\n\n${shareLink}`
        : `Check out this event: ${event.title}\n\n${shareLink}`;
      await Share.share({
        message: message,
        url: shareLink,
        title: event.title,
      });
      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  // Check if event is free
  const isFreeEvent = (): boolean => {
    if (!originalEventData) {
      console.log('[EventDetail] No originalEventData available for free check');
      return false;
    }
    
    const price = originalEventData.price;
    console.log('[EventDetail] Checking if event is free. Price:', price, 'Type:', typeof price);
    
    // Check if price is string "Free"
    if (typeof price === 'string') {
      const isFree = price.toLowerCase() === 'free' || price === 'Free';
      console.log('[EventDetail] Price is string, isFree:', isFree);
      return isFree;
    }
    
    // Check if price is number 0
    if (typeof price === 'number') {
      const isFree = price === 0;
      console.log('[EventDetail] Price is number, isFree:', isFree);
      return isFree;
    }
    
    // Check if price is array (seat types) - free if empty array or all prices are 0
    if (Array.isArray(price)) {
      const isFree = price.length === 0 || price.every(p => (p.price === 0 || p.price === undefined || p.price === null));
      console.log('[EventDetail] Price is array, isFree:', isFree, 'Array:', price);
      return isFree;
    }
    
    console.log('[EventDetail] Price format not recognized, defaulting to false');
    return false;
  };

  // Check event capacity before booking
  const checkCapacity = async (eventId: string): Promise<boolean> => {
    try {
      const response = await apiService.post<{ available: boolean; currentCount: number; maxAttendees: number | null }>(`/events/${eventId}/check-capacity`);
      
      if (response && typeof response === 'object' && 'available' in response) {
        if (!response.available && response.maxAttendees) {
          Alert.alert(
            'Event Full',
            'This event is full. No more seats available.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      }
      return true; // If capacity check fails, allow booking (backend will handle)
    } catch (err: any) {
      console.error('Capacity check failed:', err);
      // If capacity check fails, allow booking (backend will handle)
      return true;
    }
  };

  // Book free event directly
  const handleBookFreeEvent = async () => {
    if (!event || !originalEventData) return;

    // Check if user is logged in
    const token = await storageService.getToken();
    if (!token) {
      Alert.alert('Login Required', 'Please login to book tickets');
      router.push('/login');
      return;
    }

    const user = await storageService.getUser();
    if (!user || !user._id) {
      Alert.alert('Error', 'User information not found. Please login again.');
      router.push('/login');
      return;
    }

    setBookingLoading(true);
    try {
      const eventId = originalEventData._id || originalEventData.id;
      if (!eventId) {
        throw new Error('Event ID not found');
      }

      // Check capacity before booking
      const canBook = await checkCapacity(String(eventId));
      if (!canBook) {
        setBookingLoading(false);
        return;
      }

      // Call booking API
      const response = await apiService.post('/bookings', {
        eventId: String(eventId),
        userId: user._id,
      });

      console.log('Booking successful:', response);

      // Show success popup with QR code option for private events
      const isPrivate = originalEventData.visibility === 'private';
      if (isPrivate && originalEventData.shareToken) {
        Alert.alert(
          'Success',
          'Booked Ticket',
          [
            {
              text: 'Generate QR Code',
              onPress: () => {
                // Generate QR code with share link
                const baseShareUrl = getShareBaseUrl();
                const shareUrl = `${baseShareUrl}/share/${originalEventData.shareToken}`;
                router.push(`/qr-code-modal?url=${encodeURIComponent(shareUrl)}&eventId=${encodeURIComponent(String(eventId))}`);
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          '',
          'Booked Ticket',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Booking failed:', err);
      const errorMessage = err?.message || 'Failed to book ticket. Please try again.';
      if (err.status === 409 || errorMessage.includes('full')) {
        Alert.alert('Event Full', 'This event is full. No more seats available.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle book button click
  const handleBookTicket = async () => {
    console.log('[EventDetail] Book button clicked');
    
    // Check if private event and no share token (shouldn't happen if accessed via share link)
    const isPrivate = originalEventData?.visibility === 'private';
    const hasShareToken = shareToken && shareToken !== 'undefined' && shareToken !== 'null';
    
    if (isPrivate && !hasShareToken && !isCreator) {
      Alert.alert(
        'Private Event',
        'This is a private event',
        [{ text: 'OK' }]
      );
      return;
    }

    const free = isFreeEvent();
    console.log('[EventDetail] Is free event?', free);
    
    if (free) {
      console.log('[EventDetail] Handling as free event - calling handleBookFreeEvent');
      handleBookFreeEvent();
    } else {
      console.log('[EventDetail] Handling as paid event - checking capacity first');
      
      // Check capacity before navigating to ticket booking
      const eventId = originalEventData?._id || originalEventData?.id;
      if (eventId) {
        const canBook = await checkCapacity(String(eventId));
        if (!canBook) {
          return; // Capacity check will show alert
        }
      }
      
      // Navigate to ticket booking screen for paid events
      const bookingUrl = shareToken 
        ? `/ticket-booking?id=${encodeURIComponent(String(event?.id))}&shareToken=${encodeURIComponent(String(shareToken))}`
        : `/ticket-booking?id=${encodeURIComponent(String(event?.id))}`;
      router.push(bookingUrl);
    }
  };

  // Handle manage button click (only for creator)
  const handleManageEvent = () => {
    const eventId = originalEventData?._id || originalEventData?.id;
    if (eventId) {
      router.push(`/manage-private-event?id=${encodeURIComponent(String(eventId))}`);
    }
  };

  // Save event handler
  const handleSaveEvent = async () => {
    if (!event || !originalEventData) return;

    try {
      // Check if user is logged in
      const token = await storageService.getToken();
      if (!token) {
        Alert.alert('Login Required', 'Please login to save events');
        router.push('/login');
        return;
      }

      const user = await storageService.getUser();
      if (!user || !user._id) {
        Alert.alert('Error', 'User information not found. Please login again.');
        router.push('/login');
        return;
      }

      const eventId = originalEventData._id || originalEventData.id;
      if (!eventId) {
        throw new Error('Event ID not found');
      }

      // Call save event API
      const response = await apiService.post('/saved-events', {
        eventId: String(eventId),
        userId: user._id,
      });

      console.log('Event saved successfully:', response);

      // Show success popup
      Alert.alert('Success', 'This event is saved');
    } catch (err: any) {
      console.error('Failed to save event:', err);
      if (err.status === 409) {
        Alert.alert('Already Saved', 'This event is already in your saved events');
      } else {
        Alert.alert('Error', err?.message || 'Failed to save event. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A444" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <ImageWithFallback
            src={event.image}
            style={styles.image}
          />
          <View style={styles.imageOverlay} />
          
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={20} color="#000" />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleShareButton}
              >
                <Ionicons name="share-outline" size={20} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleSaveEvent}
              >
                <Ionicons name="heart-outline" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Tags and Visibility */}
          <View style={styles.tagsContainer}>
            {/* Visibility Badge */}
            {originalEventData?.visibility && (
              <View style={[
                styles.visibilityBadge,
                originalEventData.visibility === 'private' && styles.visibilityBadgePrivate
              ]}>
                <Ionicons 
                  name={originalEventData.visibility === 'private' ? 'lock-closed' : 'globe'} 
                  size={14} 
                  color="#fff" 
                />
                <Text style={styles.visibilityText}>
                  {originalEventData.visibility === 'private' ? 'Private Event' : 'Public Event'}
                </Text>
              </View>
            )}
            {event.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Host Info */}
          <View style={styles.hostContainer}>
            <ImageWithFallback
              src={event.host.avatar}
              style={styles.hostAvatar}
            />
            <View style={styles.hostInfo}>
              <Text style={styles.hostLabel}>Hosted by</Text>
              <Text style={styles.hostName}>{event.host.name}</Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Event Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.date')}</Text>
                <Text style={styles.detailValue}>{event.date}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.time')}</Text>
                <Text style={styles.detailValue}>{event.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="location-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.location')}</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
                <Text style={styles.detailSubValue}>{event.fullAddress}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="people-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('event.attendees')}</Text>
                <Text style={styles.detailValue}>{event.attendees} attending</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>{t('event.about')}</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>

          {/* Manage Button (only for creator viewing private event) */}
          {isCreator && originalEventData?.visibility === 'private' && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageEvent}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
              <Text style={styles.manageButtonText}>Manage Event</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            {typeof event.price === 'number' ? `$${event.price}` : event.price}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.bookButton, bookingLoading && styles.bookButtonDisabled]}
          onPress={handleBookTicket}
          disabled={bookingLoading}
        >
          {bookingLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>{t('event.bookTicket')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Event</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareButtonsContainer}>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareEmail}
              >
                <Ionicons name="mail-outline" size={32} color="#D4A444" />
                <Text style={styles.shareButtonText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareNative}
              >
                <Ionicons name="share-outline" size={32} color="#D4A444" />
                <Text style={styles.shareButtonText}>More</Text>
              </TouchableOpacity>
            </View>

            {shareLink && (
              <View style={styles.shareLinkContainer}>
                <Text style={styles.shareLinkLabel}>Or copy link</Text>
                <TouchableOpacity
                  style={styles.copyLinkButton}
                  onPress={handleCopyLink}
                >
                  <Ionicons name="copy-outline" size={20} color="#D4A444" />
                  <Text style={styles.copyLinkText}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  imageContainer: {
    position: 'relative',
    height: 320,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
  },
  visibilityBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  visibilityBadgePrivate: {
    backgroundColor: '#6366f1',
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  hostAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#D4A444',
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  detailIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  detailSubValue: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  bookButton: {
    flex: 2,
    backgroundColor: '#D4A444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  manageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  shareModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  shareButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    flex: 1,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 4,
  },
  shareLinkContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    alignItems: 'center',
  },
  shareLinkLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  copyLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D4A444',
  },
});


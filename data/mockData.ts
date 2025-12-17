export interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  fullAddress?: string;
  category: string;
  image: string;
  attendees: number;
  price: string | number;
  host?: {
    name: string;
    avatar: string;
    followers?: string;
  };
  description?: string;
  tags?: string[];
  capacity?: number;
  organizer?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio?: string;
  location?: string;
  stats: {
    eventsAttended: number;
    following: number;
    followers: number;
  };
}

export interface Ticket {
  id: number;
  eventId: number;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImage: string;
  ticketType: string;
  quantity: number;
  price: number;
  status: 'upcoming' | 'past' | 'cancelled';
  qrCode?: string;
}

export interface Notification {
  id: number;
  type: 'event' | 'follower' | 'payment' | 'update';
  title: string;
  message: string;
  time: string;
  read: boolean;
  eventId?: number;
}

// Mock Events Data
export const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Summer Music Festival 2025',
    date: 'Dec 15, 2025',
    time: '6:00 PM',
    endTime: '11:00 PM',
    location: 'Central Park, NYC',
    fullAddress: '123 Central Park West, New York, NY 10023',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1669670617524-5f08060c8dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBldmVudHxlbnwxfHx8fDE3NjUzNTEwMDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 234,
    price: 'Free',
    host: {
      name: 'Music Events Co.',
      avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NjUzMDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '12.5K'
    },
    description: 'Join us for an unforgettable evening of live music featuring top artists from around the world. Experience the magic of summer nights with incredible performances, food trucks, and a vibrant atmosphere. This festival brings together music lovers for a celebration of sound, culture, and community.\n\nLineup includes:\n• The Midnight Riders\n• Echo Valley\n• Sarah & The Soundwaves\n• DJ Storm\n\nFood and beverages available for purchase. Bring your blankets and lawn chairs for maximum comfort!',
    tags: ['Music', 'Outdoor', 'Festival', 'Live Performance'],
    capacity: 500,
    organizer: 'Music Events Co.'
  },
  {
    id: 2,
    title: 'Tech Innovation Summit',
    date: 'Dec 18, 2025',
    time: '9:00 AM',
    endTime: '5:00 PM',
    location: 'Convention Center',
    fullAddress: '789 Convention Blvd, San Francisco, CA 94102',
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1582192904915-d89c7250b235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwY29uZmVyZW5jZSUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3NjUzMDUzODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 456,
    price: 49,
    host: {
      name: 'Tech Innovators',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwcHJvZmlsZXxlbnwxfHx8fDE3NjUzMDUzODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '8.2K'
    },
    description: 'Explore the latest trends in technology, AI, and innovation. Network with industry leaders, attend workshops, and discover cutting-edge solutions shaping the future.',
    tags: ['Technology', 'Business', 'Innovation', 'Networking'],
    capacity: 1000,
    organizer: 'Tech Innovators'
  },
  {
    id: 3,
    title: 'Outdoor Jazz Night',
    date: 'Dec 20, 2025',
    time: '7:30 PM',
    endTime: '10:30 PM',
    location: 'Riverside Park',
    fullAddress: '456 Riverside Drive, New York, NY 10025',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1604515438635-fd331c877a6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwbXVzaWMlMjBmZXN0aXZhbHxlbnwxfHx8fDE3NjUzMDMzMjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 89,
    price: 25,
    host: {
      name: 'Jazz Collective',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwbXVzaWNpYW58ZW58MXx8fHwxNzY1MzA1MzIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '3.1K'
    },
    description: 'An intimate evening of smooth jazz under the stars. Featuring local and international jazz artists in a beautiful outdoor setting.',
    tags: ['Jazz', 'Outdoor', 'Music', 'Evening'],
    capacity: 200,
    organizer: 'Jazz Collective'
  },
  {
    id: 4,
    title: 'Professional Networking Mixer',
    date: 'Dec 22, 2025',
    time: '6:00 PM',
    endTime: '9:00 PM',
    location: 'Downtown Hotel',
    fullAddress: '321 Business Ave, New York, NY 10001',
    category: 'networking',
    image: 'https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXR3b3JraW5nJTIwYnVzaW5lc3MlMjBldmVudHxlbnwxfHx8fDE3NjUzMjY4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 123,
    price: 'Free',
    host: {
      name: 'Business Network Pro',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjUzMjY4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '15.3K'
    },
    description: 'Connect with professionals from various industries. Expand your network, share ideas, and discover new opportunities in a relaxed atmosphere.',
    tags: ['Networking', 'Business', 'Professional', 'Social'],
    capacity: 300,
    organizer: 'Business Network Pro'
  },
  {
    id: 5,
    title: 'Contemporary Art Exhibition',
    date: 'Dec 25, 2025',
    time: '10:00 AM',
    endTime: '6:00 PM',
    location: 'Modern Art Gallery',
    fullAddress: '555 Art Street, New York, NY 10011',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1719935115623-4857df23f3c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwZXhoaWJpdGlvbnxlbnwxfHx8fDE3NjUyNTgzNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 67,
    price: 15,
    host: {
      name: 'Modern Art Gallery',
      avatar: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5fGVufDF8fHx8MTc2NTMwNTMzMjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '22.7K'
    },
    description: 'Explore contemporary artworks from emerging and established artists. Featuring paintings, sculptures, and digital art installations.',
    tags: ['Art', 'Exhibition', 'Culture', 'Gallery'],
    capacity: 150,
    organizer: 'Modern Art Gallery'
  },
  {
    id: 6,
    title: 'Wellness & Yoga Workshop',
    date: 'Dec 28, 2025',
    time: '8:00 AM',
    endTime: '10:00 AM',
    location: 'Wellness Studio',
    fullAddress: '789 Wellness Way, New York, NY 10003',
    category: 'wellness',
    image: 'https://images.unsplash.com/photo-1758599879065-46fd59235166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwd2VsbG5lc3MlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjUzNTEwMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 45,
    price: 30,
    host: {
      name: 'Zen Wellness Center',
      avatar: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwd2VsbG5lc3N8ZW58MXx8fHwxNzY1MzA1MzA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '5.8K'
    },
    description: 'Start your day with a rejuvenating yoga session. Suitable for all levels. Includes meditation and mindfulness practices.',
    tags: ['Yoga', 'Wellness', 'Health', 'Meditation'],
    capacity: 50,
    organizer: 'Zen Wellness Center'
  },
  {
    id: 7,
    title: 'Food & Wine Tasting',
    date: 'Jan 5, 2026',
    time: '7:00 PM',
    endTime: '10:00 PM',
    location: 'Culinary Institute',
    fullAddress: '123 Chef Avenue, New York, NY 10004',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwd2luZXxlbnwxfHx8fDE3NjUzMDUzMDZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 156,
    price: 75,
    host: {
      name: 'Culinary Masters',
      avatar: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmfGVufDF8fHx8MTc2NTMwNTMwNnww&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '9.4K'
    },
    description: 'Experience a curated selection of fine wines paired with gourmet dishes. Learn from expert sommeliers and chefs.',
    tags: ['Food', 'Wine', 'Culinary', 'Tasting'],
    capacity: 100,
    organizer: 'Culinary Masters'
  },
  {
    id: 8,
    title: 'Startup Pitch Night',
    date: 'Jan 10, 2026',
    time: '6:30 PM',
    endTime: '9:30 PM',
    location: 'Innovation Hub',
    fullAddress: '999 Startup Street, San Francisco, CA 94105',
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwcGl0Y2h8ZW58MXx8fHwxNzY1MzA1MzA2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    attendees: 234,
    price: 35,
    host: {
      name: 'Startup Hub',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwfGVufDF8fHx8MTc2NTMwNTMwNnww&ixlib=rb-4.1.0&q=80&w=1080',
      followers: '18.6K'
    },
    description: 'Watch innovative startups pitch their ideas to investors. Network with entrepreneurs and venture capitalists.',
    tags: ['Startup', 'Pitch', 'Business', 'Innovation'],
    capacity: 400,
    organizer: 'Startup Hub'
  }
];

// Mock User Data
export const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://images.unsplash.com/photo-1704726135027-9c6f034cfa41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NjUzMDk4Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  bio: 'Event enthusiast and music lover. Always looking for the next great experience!',
  location: 'New York, NY',
  stats: {
    eventsAttended: 12,
    following: 8,
    followers: 24
  }
};

// Mock Tickets Data
export const mockTickets: Ticket[] = [
  {
    id: 1,
    eventId: 1,
    eventTitle: 'Summer Music Festival 2025',
    eventDate: 'Dec 15, 2025',
    eventTime: '6:00 PM',
    eventLocation: 'Central Park, NYC',
    eventImage: 'https://images.unsplash.com/photo-1669670617524-5f08060c8dcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBldmVudHxlbnwxfHx8fDE3NjUzNTEwMDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ticketType: 'General Admission',
    quantity: 2,
    price: 0,
    status: 'upcoming',
    qrCode: 'QR123456789'
  },
  {
    id: 2,
    eventId: 2,
    eventTitle: 'Tech Innovation Summit',
    eventDate: 'Dec 18, 2025',
    eventTime: '9:00 AM',
    eventLocation: 'Convention Center',
    eventImage: 'https://images.unsplash.com/photo-1582192904915-d89c7250b235?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwY29uZmVyZW5jZSUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3NjUzMDUzODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ticketType: 'VIP Access',
    quantity: 1,
    price: 49,
    status: 'upcoming',
    qrCode: 'QR987654321'
  },
  {
    id: 3,
    eventId: 3,
    eventTitle: 'Outdoor Jazz Night',
    eventDate: 'Dec 20, 2025',
    eventTime: '7:30 PM',
    eventLocation: 'Riverside Park',
    eventImage: 'https://images.unsplash.com/photo-1604515438635-fd331c877a6b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvdXRkb29yJTIwbXVzaWMlMjBmZXN0aXZhbHxlbnwxfHx8fDE3NjUzMDMzMjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ticketType: 'General Admission',
    quantity: 1,
    price: 25,
    status: 'upcoming',
    qrCode: 'QR456789123'
  },
  {
    id: 4,
    eventId: 4,
    eventTitle: 'Professional Networking Mixer',
    eventDate: 'Nov 20, 2024',
    eventTime: '6:00 PM',
    eventLocation: 'Downtown Hotel',
    eventImage: 'https://images.unsplash.com/photo-1675716921224-e087a0cca69a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXR3b3JraW5nJTIwYnVzaW5lc3MlMjBldmVudHxlbnwxfHx8fDE3NjUzMjY4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ticketType: 'General Admission',
    quantity: 1,
    price: 0,
    status: 'past',
    qrCode: 'QR789123456'
  }
];

// Mock Notifications Data
export const mockNotifications: Notification[] = [
  {
    id: 1,
    type: 'event',
    title: 'New Event Near You',
    message: 'Summer Music Festival 2025 is happening near you!',
    time: '2h ago',
    read: false,
    eventId: 1
  },
  {
    id: 2,
    type: 'event',
    title: 'Event Starting Soon',
    message: 'Tech Innovation Summit starts in 2 hours',
    time: '3h ago',
    read: false,
    eventId: 2
  },
  {
    id: 3,
    type: 'follower',
    title: 'New Follower',
    message: 'Music Events Co. started following you',
    time: '1d ago',
    read: true
  },
  {
    id: 4,
    type: 'payment',
    title: 'Payment Confirmed',
    message: 'Your payment for Outdoor Jazz Night has been confirmed',
    time: '2d ago',
    read: true,
    eventId: 3
  },
  {
    id: 5,
    type: 'update',
    title: 'Event Update',
    message: 'Summer Music Festival 2025 has been updated',
    time: '3d ago',
    read: true,
    eventId: 1
  }
];

// Helper functions to get data
export const getEventById = (id: number): Event | undefined => {
  return mockEvents.find(event => event.id === id);
};

export const getTicketsByStatus = (status: 'upcoming' | 'past' | 'cancelled'): Ticket[] => {
  return mockTickets.filter(ticket => ticket.status === status);
};

export const getEventsByCategory = (category: string): Event[] => {
  if (category === 'all') return mockEvents;
  return mockEvents.filter(event => event.category === category);
};

export const getUnreadNotifications = (): Notification[] => {
  return mockNotifications.filter(notification => !notification.read);
};


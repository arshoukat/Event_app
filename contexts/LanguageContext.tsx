import { createContext, useContext, useState, ReactNode } from 'react';
import { I18nManager } from 'react-native';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  en: {
    // Auth
    'auth.createAccount': 'Create Account',
    'auth.signIn': 'Sign In',
    'auth.verifyOTP': 'Verify OTP',
    'auth.completeProfile': 'Complete Profile',
    'auth.phoneNumber': 'Phone Number',
    'auth.enterPhone': 'Enter your phone number to get started',
    'auth.sentCodeTo': 'We sent a code to',
    'auth.tellAboutYourself': 'Tell us about yourself',
    'auth.sendOTP': 'Send OTP',
    'auth.verifyAndContinue': 'Verify & Continue',
    'auth.createAccountButton': 'Create Account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    'auth.signUp': 'Sign up',
    'auth.fullName': 'Full Name',
    'auth.email': 'Email (Optional)',
    'auth.emailRequired': 'Email',
    'auth.password': 'Password',
    'auth.createPassword': 'Create Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.enterFullName': 'Enter your full name',
    'auth.enterEmail': 'Enter your email',
    'auth.enterPassword': 'Enter your password',
    'auth.createPasswordPlaceholder': 'Create a password',
    'auth.confirmPasswordPlaceholder': 'Confirm your password',
    'auth.welcomeBack': 'Welcome Back',
    'auth.signInToContinue': 'Sign in to continue to your account',
    'auth.verificationCode': 'We\'ll send you a verification code',
    'auth.enterDigitCode': 'Enter 6-digit code',
    'auth.didntReceiveCode': 'Didn\'t receive code?',
    'auth.resendOTP': 'Resend OTP',
    'auth.sending': 'Sending...',
    'auth.changePhoneNumber': 'Change phone number',
    'auth.changeEmail': 'Change email',
    'auth.enterEmailToGetStarted': 'Enter your email address to get started',
    'auth.enterEmailToReset': 'Enter your email address to reset your password',
    'auth.termsAccept': 'I agree to the',
    'auth.termsOfService': 'Terms of Service',
    'auth.and': 'and',
    'auth.privacyPolicy': 'Privacy Policy',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.language': 'Language',
    'auth.selectLanguage': 'Select your preferred language',
    'auth.resetPassword': 'Reset Password',
    'auth.enterPhoneToReset': 'Enter your phone number to reset password',
    'auth.verificationCodeWillBeSent': 'We\'ll send you a verification code',
    'auth.createNewPassword': 'Create New Password',
    'auth.enterNewPassword': 'Enter your new password',
    'auth.newPassword': 'New Password',
    'auth.confirmNewPassword': 'Confirm New Password',
    'auth.passwordsDoNotMatch': 'Passwords do not match',
    'auth.passwordTooShort': 'Password must be at least 6 characters',
    'auth.passwordResetSuccess': 'Password reset successfully! Please login with your new password.',
    'auth.phoneNotFound': 'Phone number not found. Please check and try again.',
    'auth.passwordRequirements': 'Password must be at least 6 characters long',
    'auth.resetPasswordButton': 'Reset Password',
    'auth.rememberMe': 'Remember me',
    
    // Home
    'home.discoverEvents': 'Discover Events',
    'home.createEvent': 'Create Event',
    'home.attendees': 'attendees',
    'home.free': 'Free',
    
    // Navigation
    'nav.home': 'Home',
    'nav.calendar': 'Calendar',
    'nav.myEvents': 'My Events',
    'nav.tickets': 'Tickets',
    'nav.profile': 'Profile',
    
    // Event Details
    'event.bookTicket': 'Book Ticket',
    'event.about': 'About Event',
    'event.location': 'Location',
    'event.date': 'Date',
    'event.time': 'Time',
    'event.organizer': 'Organizer',
    'event.attendees': 'Attendees',
    'event.shareEvent': 'Share Event',
    'event.saveEvent': 'Save Event',
    
    // Create Event
    'createEvent.title': 'Create Event',
    'createEvent.publish': 'Publish',
    'createEvent.coverImage': 'Cover Image',
    'createEvent.uploadCover': 'Upload cover image',
    'createEvent.eventTitle': 'Event Title',
    'createEvent.eventTitlePlaceholder': 'Give your event a catchy title',
    'createEvent.description': 'Description',
    'createEvent.descriptionPlaceholder': 'Describe what makes your event special...',
    'createEvent.date': 'Date',
    'createEvent.startTime': 'Start Time',
    'createEvent.endTime': 'End Time',
    'createEvent.eventType': 'Event Type',
    'createEvent.inPerson': 'In-Person',
    'createEvent.online': 'Online',
    'createEvent.location': 'Location',
    'createEvent.locationPlaceholder': 'City, State or Address',
    'createEvent.venue': 'Venue',
    'createEvent.venuePlaceholder': 'e.g., Central Park Pavilion',
    'createEvent.onlineLink': 'Online Event Link',
    'createEvent.onlineLinkPlaceholder': 'https://zoom.us/j/...',
    'createEvent.category': 'Category',
    'createEvent.selectCategory': 'Select a category',
    'createEvent.capacity': 'Capacity',
    'createEvent.capacityPlaceholder': 'Unlimited',
    'createEvent.price': 'Price',
    'createEvent.pricePlaceholder': '0 (Free)',
    'createEvent.tags': 'Tags (up to 5)',
    'createEvent.addTag': 'Add a tag...',
    'createEvent.add': 'Add',
    'createEvent.privacySettings': 'Privacy & Settings',
    'createEvent.visibility': 'Visibility',
    'createEvent.public': 'Public',
    'createEvent.private': 'Private',
    'createEvent.requireApproval': 'Require approval for RSVPs',
    'createEvent.allowGuests': 'Allow guests to invite others',
    'createEvent.paymentType': 'Payment Type',
    'createEvent.free': 'Free',
    'createEvent.paid': 'Paid',
    'createEvent.paymentStructure': 'Payment Structure',
    'createEvent.paymentStructureHint': 'Add different seat types with their prices',
    'createEvent.seatTypeName': 'Seat Type (e.g., General)',
    'createEvent.riyal': 'SAR',
    'createEvent.addAtLeastOneSeatType': 'Please add at least one seat type for paid events',
    'createEvent.requiresLicense': 'Does this event require a license?',
    'createEvent.requiresLicenseHint': 'Upload a PDF license document if required',
    'createEvent.uploadLicense': 'Upload License PDF',
    'createEvent.uploadLicenseRequired': 'Please upload a license document',
    
    // Categories
    'category.music': 'Music',
    'category.tech': 'Tech & Business',
    'category.art': 'Art & Culture',
    'category.sports': 'Sports & Fitness',
    'category.food': 'Food & Drink',
    'category.networking': 'Networking',
    'category.wellness': 'Health & Wellness',
    'category.education': 'Education',
    'category.entertainment': 'Entertainment',
    'category.other': 'Other',
    
    // Profile
    'profile.title': 'Profile',
    'profile.events': 'Events',
    'profile.following': 'Following',
    'profile.followers': 'Followers',
    'profile.account': 'Account',
    'profile.editProfile': 'Edit Profile',
    'profile.savedEvents': 'Saved Events',
    'profile.myEvents': 'My Events',
    'profile.paymentMethods': 'Payment Methods',
    'profile.preferences': 'Preferences',
    'profile.notifications': 'Notifications',
    'profile.settings': 'Settings',
    'profile.helpSupport': 'Help & Support',
    'profile.logout': 'Log Out',
    
    // Tickets
    'tickets.myTickets': 'My Tickets',
    'tickets.upcoming': 'Upcoming',
    'tickets.past': 'Past',
    'tickets.noUpcoming': 'No upcoming tickets',
    'tickets.noPast': 'No past tickets',
    'tickets.bookTickets': 'Book tickets to events you want to attend',
    'tickets.attendedTickets': 'Your attended events will appear here',
    
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.noEvents': 'No events scheduled',
    'calendar.browseEvents': 'Browse events and start booking',
    
    // Common
    'common.back': 'Back',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.required': '*',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.viewTicket': 'View Ticket',
    'common.ticket': 'Ticket',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.newEventNearYou': 'New Event Near You',
    'notifications.eventStartingSoon': 'Event Starting Soon',
    'notifications.newFollower': 'New Follower',
    'notifications.eventUpdate': 'Event Update',
    'notifications.paymentConfirmed': 'Payment Confirmed',
    'notifications.timeAgo.hoursAgo': 'h ago',
    'notifications.timeAgo.daysAgo': 'd ago',
    
    // Settings
    'settings.title': 'Settings',
    'settings.notifications': 'Notifications',
    'settings.pushNotifications': 'Push Notifications',
    'settings.emailNotifications': 'Email Notifications',
    'settings.eventReminders': 'Event Reminders',
    'settings.appearance': 'Appearance',
    'settings.darkMode': 'Dark Mode',
    'settings.language': 'Language',
    'settings.privacySecurity': 'Privacy & Security',
    'settings.changePassword': 'Change Password',
    'settings.twoFactorAuth': 'Two-Factor Authentication',
    'settings.loginActivity': 'Login Activity',
    'settings.dataPrivacy': 'Data & Privacy',
    'settings.account': 'Account',
    'settings.deleteAccount': 'Delete Account',
    'settings.version': 'Version',
    'settings.copyright': '© 2025 Events App. All rights reserved.',
    'settings.english': 'English',
    'settings.arabic': 'العربية',
    
    // Edit Profile
    'editProfile.title': 'Edit Profile',
    'editProfile.save': 'Save',
    'editProfile.saveChanges': 'Save Changes',
    'editProfile.changeProfilePhoto': 'Change profile photo',
    'editProfile.fullName': 'Full Name',
    'editProfile.email': 'Email',
    'editProfile.phoneNumber': 'Phone Number',
    'editProfile.location': 'Location',
    'editProfile.bio': 'Bio',
    'editProfile.bioPlaceholder': 'Tell us about yourself...',
    
    // My Events
    'myEvents.title': 'My Events',
    'myEvents.upcoming': 'Upcoming',
    'myEvents.past': 'Past',
    'myEvents.noUpcoming': 'No upcoming events',
    'myEvents.noPast': 'No past events',
    'myEvents.bookTickets': 'Book tickets to events you want to attend',
    'myEvents.attendedEvents': 'Your attended events will appear here',
    'myEvents.confirmed': 'Confirmed',
    'myEvents.attended': 'Attended',
    
    // Saved Events
    'savedEvents.title': 'Saved Events',
    'savedEvents.noSaved': 'No saved events',
    'savedEvents.saveEvents': 'Save events you\'re interested in',
    
    // Event Booking
    'booking.title': 'Book Ticket',
    'booking.selectTickets': 'Select Tickets',
    'booking.ticketType': 'Ticket Type',
    'booking.quantity': 'Quantity',
    'booking.price': 'Price',
    'booking.total': 'Total',
    'booking.processingFee': 'Processing Fee',
    'booking.tax': 'Tax',
    'booking.grandTotal': 'Grand Total',
    'booking.confirmBooking': 'Confirm Booking',
    'booking.proceedToPayment': 'Proceed to Payment',
    'booking.generalAdmission': 'General Admission',
    'booking.vipAccess': 'VIP Access',
    'booking.fullAccessPass': 'Full access to all areas',
    'booking.premiumSeating': 'Premium seating and exclusive lounge access',
    
    // Help & Support
    'help.title': 'Help & Support',
    'help.faq': 'FAQ',
    'help.contactUs': 'Contact Us',
    'help.reportIssue': 'Report an Issue',
    'help.termsOfService': 'Terms of Service',
    'help.privacyPolicy': 'Privacy Policy',
    'help.aboutUs': 'About Us',
    
    // Payment
    'payment.title': 'Payment',
    'payment.cardNumber': 'Card Number',
    'payment.expiryDate': 'Expiry Date',
    'payment.cvv': 'CVV',
    'payment.cardholderName': 'Cardholder Name',
    'payment.payNow': 'Pay Now',
    'payment.processing': 'Processing...',
    'payment.success': 'Payment Successful',
    'payment.failed': 'Payment Failed',
  },
  ar: {
    // Auth
    'auth.createAccount': 'إنشاء حساب',
    'auth.signIn': 'تسجيل الدخول',
    'auth.verifyOTP': 'التحقق من الرمز',
    'auth.completeProfile': 'إكمال الملف الشخصي',
    'auth.phoneNumber': 'رقم الهاتف',
    'auth.enterPhone': 'أدخل رقم هاتفك للبدء',
    'auth.sentCodeTo': 'أرسلنا رمزًا إلى',
    'auth.tellAboutYourself': 'أخبرنا عن نفسك',
    'auth.sendOTP': 'إرسال الرمز',
    'auth.verifyAndContinue': 'التحقق والمتابعة',
    'auth.createAccountButton': 'إنشاء الحساب',
    'auth.alreadyHaveAccount': 'هل لديك حساب بالفعل؟',
    'auth.dontHaveAccount': 'ليس لديك حساب؟',
    'auth.signUp': 'سجل',
    'auth.fullName': 'الاسم الكامل',
    'auth.email': 'البريد الإلكتروني (اختياري)',
    'auth.emailRequired': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.createPassword': 'إنشاء كلمة مرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.enterFullName': 'أدخل اسمك الكامل',
    'auth.enterEmail': 'أدخل بريدك الإلكتروني',
    'auth.enterPassword': 'أدخل كلمة المرور',
    'auth.createPasswordPlaceholder': 'أنشئ كلمة مرور',
    'auth.confirmPasswordPlaceholder': 'أكد كلمة المرور',
    'auth.welcomeBack': 'مرحبًا بعودتك',
    'auth.signInToContinue': 'سجل الدخول للمتابعة إلى حسابك',
    'auth.verificationCode': 'سنرسل لك رمز التحقق',
    'auth.enterDigitCode': 'أدخل الرمز المكون من 6 أرقام',
    'auth.didntReceiveCode': 'لم تستلم الرمز؟',
    'auth.resendOTP': 'إعادة إرسال الرمز',
    'auth.sending': 'جارٍ الإرسال...',
    'auth.changePhoneNumber': 'تغيير رقم الهاتف',
    'auth.changeEmail': 'تغيير البريد الإلكتروني',
    'auth.enterEmailToGetStarted': 'أدخل عنوان بريدك الإلكتروني للبدء',
    'auth.enterEmailToReset': 'أدخل عنوان بريدك الإلكتروني لإعادة تعيين كلمة المرور',
    'auth.termsAccept': 'أوافق على',
    'auth.termsOfService': 'شروط الخدمة',
    'auth.and': 'و',
    'auth.privacyPolicy': 'سياسة الخصوصية',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.language': 'اللغة',
    'auth.selectLanguage': 'اختر لغتك المفضلة',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.enterPhoneToReset': 'أدخل رقم هاتفك لإعادة تعيين كلمة المرور',
    'auth.verificationCodeWillBeSent': 'سنرسل لك رمز التحقق',
    'auth.createNewPassword': 'إنشاء كلمة مرور جديدة',
    'auth.enterNewPassword': 'أدخل كلمة مرورك الجديدة',
    'auth.newPassword': 'كلمة مرور جديدة',
    'auth.confirmNewPassword': 'تأكيد كلمة المرور الجديدة',
    'auth.passwordsDoNotMatch': 'كلمات المرور غير متطابقة',
    'auth.passwordTooShort': 'يجب أن تكون كلمة المرور على الأقل 6 أحرف',
    'auth.passwordResetSuccess': 'تم إعادة تعيين كلمة المرور بنجاح! يرجى تسجيل الدخول باستخدام كلمة المرور الجديدة.',
    'auth.phoneNotFound': 'رقم الهاتف غير موجود. يرجى التحقق منه وحاول مرة أخرى.',
    'auth.passwordRequirements': 'يجب أن تكون كلمة المرور على الأقل 6 أحرف طولًا',
    'auth.resetPasswordButton': 'إعادة تعيين كلمة المرور',
    'auth.rememberMe': 'تذكرني',
    
    // Home
    'home.discoverEvents': 'اكتشف الفعاليات',
    'home.createEvent': 'إنشاء فعالية',
    'home.attendees': 'حضور',
    'home.free': 'مجاني',
    
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.calendar': 'التقويم',
    'nav.myEvents': 'فعالياتي',
    'nav.tickets': 'التذاكر',
    'nav.profile': 'الملف الشخصي',
    
    // Event Details
    'event.bookTicket': 'حجز تذكرة',
    'event.about': 'حول الفعالية',
    'event.location': 'الموقع',
    'event.date': 'التاريخ',
    'event.time': 'الوقت',
    'event.organizer': 'المنظم',
    'event.attendees': 'الحضور',
    'event.shareEvent': 'مشاركة الفعالية',
    'event.saveEvent': 'حفظ الفعالية',
    
    // Create Event
    'createEvent.title': 'إنشاء فعالية',
    'createEvent.publish': 'نشر',
    'createEvent.coverImage': 'صورة الغلاف',
    'createEvent.uploadCover': 'تحميل صورة الغلاف',
    'createEvent.eventTitle': 'عنوان الفعالية',
    'createEvent.eventTitlePlaceholder': 'أعط فعاليتك عنوانًا جذابًا',
    'createEvent.description': 'الوصف',
    'createEvent.descriptionPlaceholder': 'صف ما يجعل فعاليتك مميزة...',
    'createEvent.date': 'التاريخ',
    'createEvent.startTime': 'وقت البداية',
    'createEvent.endTime': 'وقت الانتهاء',
    'createEvent.eventType': 'نوع الفعالية',
    'createEvent.inPerson': 'حضوري',
    'createEvent.online': 'عبر الإنترنت',
    'createEvent.location': 'الموقع',
    'createEvent.locationPlaceholder': 'المدينة، الولاية أو العنوان',
    'createEvent.venue': 'المكان',
    'createEvent.venuePlaceholder': 'مثل: جناح الحديقة المركزية',
    'createEvent.onlineLink': 'رابط الفعالية الإلكترونية',
    'createEvent.onlineLinkPlaceholder': 'https://zoom.us/j/...',
    'createEvent.category': 'الفئة',
    'createEvent.selectCategory': 'اختر فئة',
    'createEvent.capacity': 'السعة',
    'createEvent.capacityPlaceholder': 'غير محدود',
    'createEvent.price': 'السعر',
    'createEvent.pricePlaceholder': '0 (مجاني)',
    'createEvent.tags': 'الوسوم (حتى 5)',
    'createEvent.addTag': 'أضف وسمًا...',
    'createEvent.add': 'إضافة',
    'createEvent.privacySettings': 'الخصوصية والإعدادات',
    'createEvent.visibility': 'الظهور',
    'createEvent.public': 'عام',
    'createEvent.private': 'خاص',
    'createEvent.requireApproval': 'يتطلب موافقة للحضور',
    'createEvent.allowGuests': 'السماح للضيوف بدعوة آخرين',
    'createEvent.paymentType': 'نوع الدفع',
    'createEvent.free': 'مجاني',
    'createEvent.paid': 'مدفوع',
    'createEvent.paymentStructure': 'هيكل الدفع',
    'createEvent.paymentStructureHint': 'أضف أنواع المقاعد المختلفة مع أسعارها',
    'createEvent.seatTypeName': 'نوع المقعد (مثل: عام)',
    'createEvent.riyal': 'ريال',
    'createEvent.addAtLeastOneSeatType': 'يرجى إضافة نوع مقعد واحد على الأقل للفعاليات المدفوعة',
    'createEvent.requiresLicense': 'هل تتطلب هذه الفعالية ترخيصًا؟',
    'createEvent.requiresLicenseHint': 'قم بتحميل مستند الترخيص بصيغة PDF إذا كان مطلوبًا',
    'createEvent.uploadLicense': 'تحميل ترخيص PDF',
    'createEvent.uploadLicenseRequired': 'يرجى تحميل مستند الترخيص',
    
    // Categories
    'category.music': 'موسيقى',
    'category.tech': 'تكنولوجيا وأعمال',
    'category.art': 'فن وثقافة',
    'category.sports': 'رياضة ولياقة',
    'category.food': 'طعام وشراب',
    'category.networking': 'تواصل',
    'category.wellness': 'صحة وعافية',
    'category.education': 'تعليم',
    'category.entertainment': 'ترفيه',
    'category.other': 'أخرى',
    
    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.events': 'الفعاليات',
    'profile.following': 'المتابَعون',
    'profile.followers': 'المتابِعون',
    'profile.account': 'الحساب',
    'profile.editProfile': 'تعديل الملف الشخصي',
    'profile.savedEvents': 'الفعاليات المحفوظة',
    'profile.myEvents': 'فعالياتي',
    'profile.paymentMethods': 'طق الدفع',
    'profile.preferences': 'التفضيلات',
    'profile.notifications': 'الإشعارات',
    'profile.settings': 'الإعدادات',
    'profile.helpSupport': 'المساعدة والدعم',
    'profile.logout': 'تسجيل الخروج',
    
    // Tickets
    'tickets.myTickets': 'تذاكري',
    'tickets.upcoming': 'القادمة',
    'tickets.past': 'السابقة',
    'tickets.noUpcoming': 'لا توجد تذاكر قادمة',
    'tickets.noPast': 'لا توجد تذاكر سابقة',
    'tickets.bookTickets': 'احجز تذاكر للفعاليات التي تريد حضورها',
    'tickets.attendedTickets': 'ستظهر الفعاليات التي حضرتها هنا',
    
    // Calendar
    'calendar.title': 'التقويم',
    'calendar.noEvents': 'لا توجد فعاليات مجدولة',
    'calendar.browseEvents': 'تصفح الفعاليات وابدأ الحجز',
    
    // Common
    'common.back': 'رجوع',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.share': 'مشاركة',
    'common.required': '*',
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.viewTicket': 'عرض التذكرة',
    'common.ticket': 'تذكرة',
    
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.newEventNearYou': 'فعالية جديدة بالقرب منك',
    'notifications.eventStartingSoon': 'الفعالية تبدأ قريبًا',
    'notifications.newFollower': 'متابع جديد',
    'notifications.eventUpdate': 'تحديث الفعالية',
    'notifications.paymentConfirmed': 'تم تأكيد الدفع',
    'notifications.timeAgo.hoursAgo': 'س',
    'notifications.timeAgo.daysAgo': 'ي',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.notifications': 'الإشعارات',
    'settings.pushNotifications': 'الإشعارات الفورية',
    'settings.emailNotifications': 'إشعارات البريد الإلكتروني',
    'settings.eventReminders': 'تذكيرات الفعاليات',
    'settings.appearance': 'المظهر',
    'settings.darkMode': 'الوضع الداكن',
    'settings.language': 'اللغة',
    'settings.privacySecurity': 'الخصوصية والأمان',
    'settings.changePassword': 'تغيير كلمة المرور',
    'settings.twoFactorAuth': 'المصادقة الثنائية',
    'settings.loginActivity': 'نشاط تسجيل الدخول',
    'settings.dataPrivacy': 'البيانات والخصوصية',
    'settings.account': 'الحساب',
    'settings.deleteAccount': 'حذف الحساب',
    'settings.version': 'الإصدار',
    'settings.copyright': '© 2025 تطبيق الفعاليات. جميع الحقوق محفوظة.',
    'settings.english': 'English',
    'settings.arabic': 'العربية',
    
    // Edit Profile
    'editProfile.title': 'تعديل الملف الشخصي',
    'editProfile.save': 'حفظ',
    'editProfile.saveChanges': 'حفظ التغييرات',
    'editProfile.changeProfilePhoto': 'تغيير صورة الملف الشخصي',
    'editProfile.fullName': 'الاسم الكامل',
    'editProfile.email': 'البريد الإلكتروني',
    'editProfile.phoneNumber': 'رقم الهاتف',
    'editProfile.location': 'الموقع',
    'editProfile.bio': 'السيرة الذاتية',
    'editProfile.bioPlaceholder': 'أخبرنا عن نفسك...',
    
    // My Events
    'myEvents.title': 'فعالياتي',
    'myEvents.upcoming': 'القادمة',
    'myEvents.past': 'السابقة',
    'myEvents.noUpcoming': 'لا توجد فعاليات قادمة',
    'myEvents.noPast': 'لا توجد فعاليات سابقة',
    'myEvents.bookTickets': 'احجز تذاكر للفعاليات التي تريد حضورها',
    'myEvents.attendedEvents': 'ستظهر الفعاليات التي حضرتها هنا',
    'myEvents.confirmed': 'مؤكد',
    'myEvents.attended': 'حضرت',
    
    // Saved Events
    'savedEvents.title': 'الفعاليات المحفوظة',
    'savedEvents.noSaved': 'لا توجد فعاليات محفوظة',
    'savedEvents.saveEvents': 'احفظ الفعاليات التي تهمك',
    
    // Event Booking
    'booking.title': 'حجز تذكرة',
    'booking.selectTickets': 'اختر التذاكر',
    'booking.ticketType': 'نوع التذكرة',
    'booking.quantity': 'الكمية',
    'booking.price': 'السعر',
    'booking.total': 'المجموع',
    'booking.processingFee': 'رسوم المعالجة',
    'booking.tax': 'الضريبة',
    'booking.grandTotal': 'المجموع الكلي',
    'booking.confirmBooking': 'تأكيد الحجز',
    'booking.proceedToPayment': 'المتابعة للدفع',
    'booking.generalAdmission': 'دخول عام',
    'booking.vipAccess': 'دخول كبار الشخصيات',
    'booking.fullAccessPass': 'وصول كامل لجميع المناطق',
    'booking.premiumSeating': 'مقاعد ممتازة ووصول حصري للصالة',
    
    // Help & Support
    'help.title': 'المساعدة والدعم',
    'help.faq': 'الأسئلة الشائعة',
    'help.contactUs': 'اتصل بنا',
    'help.reportIssue': 'الإبلاغ عن مشكلة',
    'help.termsOfService': 'شروط الخدمة',
    'help.privacyPolicy': 'سياسة الخصوصية',
    'help.aboutUs': 'معلومات عنا',
    
    // Payment
    'payment.title': 'الدفع',
    'payment.cardNumber': 'رقم البطاقة',
    'payment.expiryDate': 'تاريخ الانتهاء',
    'payment.cvv': 'رمز التحقق',
    'payment.cardholderName': 'اسم حامل البطاقة',
    'payment.payNow': 'ادفع الآن',
    'payment.processing': 'جارٍ المعالجة...',
    'payment.success': 'نجحت العملية',
    'payment.failed': 'فشلت العملية',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  const isRTL = language === 'ar';

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    // Force RTL layout change in React Native
    if (lang === 'ar') {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
    // Note: App restart may be required for RTL changes to take full effect
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}


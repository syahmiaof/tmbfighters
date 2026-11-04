/**
 * TMB Fighters E2E Test Suite Configuration
 * Provides environment settings, endpoints, credentials, and validation rules.
 */

export const config = {
  // Supabase Infrastructure
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://avdbuqyxckswmexackwc.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZGJ1cXl4Y2tzd21leGFja3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NjUyNTUsImV4cCI6MjEwOTM0MTI1NX0.hxt9wMXHxg3AFl0vHJKmY9zFRNobzs-RPPENemgRwlo',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JJheugnFb8p70kZ6jPKmOg_wKMe0WZT',

  // Application Endpoints
  appUrl: process.env.APP_URL || 'http://localhost:5173',

  // Test Admin Credentials
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    email: process.env.ADMIN_EMAIL || 'admin@tmbfighters.com',
    password: process.env.ADMIN_PASSWORD || 'admin1234',
    role: 'admin'
  },

  // Test Athlete Credentials (Primary test athlete)
  athlete: {
    matricNumber: process.env.TEST_ATHLETE_MATRIC || 'DFK2401',
    icNumber: process.env.TEST_ATHLETE_IC || '040115-01-1234',
    fullName: 'Peserta 01 (Ahmad Bin Razak)',
    email: process.env.TEST_ATHLETE_EMAIL || 'dfk2401@tmbfighters.com',
    password: process.env.TEST_ATHLETE_PASSWORD || 'Athlete@123',
    program: 'DFK sem 1',
    gender: 'Lelaki',
    phone: '0101110001'
  },

  // Second Athlete Credentials (For multi-user boundary & isolation tests)
  athleteSecondary: {
    matricNumber: 'DTK2402',
    icNumber: '040220-02-2345',
    fullName: 'Peserta 02 (Siti Nurhaliza)',
    email: 'dtk2402@tmbfighters.com',
    password: 'Athlete@123',
    program: 'DTK sem 2'
  },

  // Business Rules & Limits
  rules: {
    monthlyFee: 10.00,
    expectedDummyAthletesCount: 30,
    expectedDummyPaymentsCount: 90,
    storageBucket: 'avatars',
    maxPhotoSizeClient: 2 * 1024 * 1024, // 2MB
    maxPhotoSizeBucket: 5 * 1024 * 1024, // 5MB
    allowedImageMimes: ['image/jpeg', 'image/png', 'image/webp'],
    disallowedMimes: ['application/pdf', 'text/plain', 'application/x-msdownload']
  }
};

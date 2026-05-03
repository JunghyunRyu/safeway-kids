// Shared test fixtures for PT/CC mobile apps (Tech Spec FR-8.3).
// Use in app __tests__ via:  import { fixtures } from '@safeway/core-mobile/__tests__/fixtures';

export const userFixture = {
  parent: {
    id: 'user-parent-1',
    role: 'parent',
    phone: '01011112222',
    name: '테스트 보호자',
    app_context: 'pettracker',
    firebase_uid: 'fb-uid-parent-1',
  },
  walker: {
    id: 'user-walker-1',
    role: 'walker',
    phone: '01033334444',
    name: '테스트 산책사',
    app_context: 'pettracker',
    firebase_uid: 'fb-uid-walker-1',
  },
  caregiver: {
    id: 'user-caregiver-1',
    role: 'caregiver',
    phone: '01055556666',
    name: '테스트 돌봄사',
    app_context: 'careconnect',
    firebase_uid: 'fb-uid-caregiver-1',
  },
};

export const walkerFixture = {
  approved: {
    id: 'walker-1',
    name: '김산책',
    bio: '5년 경력의 산책 전문가입니다',
    experience_years: 5,
    approval_status: 'approved',
    certification_type: '동물보건사',
    avg_rating: 4.8,
    total_walks: 30,
    total_reviews: 18,
    has_insurance: true,
    insurance_expiry: '2027-04-24',
    profile_photo_url: null,
  },
  pending: {
    id: 'walker-2',
    name: '이대기',
    bio: null,
    experience_years: 1,
    approval_status: 'pending',
    certification_type: null,
    avg_rating: null,
    total_walks: 0,
    total_reviews: 0,
    has_insurance: false,
    insurance_expiry: null,
    profile_photo_url: null,
  },
};

export const petFixture = {
  small: {
    id: 'pet-1',
    name: '몽이',
    breed: '몰티즈',
    size: 'small' as const,
    weight_kg: 4.2,
    temperament: 'calm',
  },
  large: {
    id: 'pet-2',
    name: '바둑이',
    breed: '진돗개',
    size: 'large' as const,
    weight_kg: 22.5,
    temperament: 'active',
  },
};

export const bookingFixture = {
  pending: {
    id: 'booking-1',
    pet_id: 'pet-1',
    walker_id: null,
    duration_minutes: 60,
    scheduled_at: '2026-05-01T14:00:00Z',
    price: 25000,
    status: 'pending',
  },
  confirmed: {
    id: 'booking-2',
    pet_id: 'pet-1',
    walker_id: 'walker-1',
    duration_minutes: 30,
    scheduled_at: '2026-05-02T15:00:00Z',
    price: 15000,
    status: 'confirmed',
  },
};

export const childFixture = {
  preschool: {
    id: 'child-1',
    name: '민준',  // decrypted form (백엔드는 AES-GCM)
    birth_date: '2022-03-15',
    age_group: 'preschool',
    allergies: '땅콩',
  },
};

export const careBookingFixture = {
  handover: {
    id: 'cc-booking-1',
    parent_id: 'user-parent-1',
    caregiver_id: 'user-caregiver-1',
    caregiver_name: '테스트 돌봄사',
    child_id: 'child-1',
    child_name: '민준',
    care_type: 'home_visit',
    scheduled_at: '2026-05-01T13:00:00Z',
    duration_hours: 4,
    hourly_rate: 12500,
    care_address: '서울시 강남구 역삼동 123',
    status: 'handover_pending',
    commission_rate: 20,
  },
};

export const fixtures = {
  user: userFixture,
  walker: walkerFixture,
  pet: petFixture,
  booking: bookingFixture,
  child: childFixture,
  careBooking: careBookingFixture,
};

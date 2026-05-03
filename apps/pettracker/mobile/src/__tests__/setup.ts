// PetTracker mobile test setup — based on SafeWay Kids pattern.

// Mock axios early — its fetch adapter eagerly probes globalThis.fetch.
jest.mock('axios', () => {
  const inst = {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  };
  return {
    __esModule: true,
    default: { create: () => inst, ...inst },
    create: () => inst,
    ...inst,
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'http://localhost:8000/api/v1',
        appContext: 'pettracker',
        eas: { projectId: 'test-pt-project' },
      },
    },
  },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'test-token' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('expo-device', () => ({ isDevice: false }));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaTypeOptions: { Images: 'Images' },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 37.5, longitude: 127.0, accuracy: 10, altitude: 0, heading: 0, speed: 0 },
  }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { High: 4, Highest: 6 },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/test/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: '/test/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = (props: any) => React.createElement('Text', props, props.name);
  return {
    Ionicons: Object.assign(MockIcon, { glyphMap: {} }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }));

jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: (props: any) => React.createElement('View', props),
    default: (props: any) => React.createElement('View', props),
  };
});

jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useFocusEffect: (cb: () => void) => {
      const React2 = require('react');
      React2.useEffect(() => { cb(); }, []);
    },
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    useRoute: () => ({ params: {} }),
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const Tab = {
    Navigator: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Screen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
  return { createBottomTabNavigator: () => Tab };
});

// @safeway/core-mobile shared package mock
jest.mock('@safeway/core-mobile', () => {
  const React = require('react');
  const createTheme = (palette: any) => ({
    Colors: palette,
    Typography: {
      sizes: { xs: 12, sm: 13, base: 14, md: 16, lg: 18, xl: 20, xxl: 28 },
      weights: { regular: '400', medium: '500', semibold: '600', bold: '700' },
    },
    Spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 },
    Radius: { sm: 4, md: 8, lg: 12, full: 9999 },
    Shadows: { sm: {}, md: {}, lg: {} },
    STATUS_COLORS: {},
    STATUS_BG_COLORS: {},
  });
  return {
    DatePickerModal: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    formatKorean: (date: string | Date) => String(date),
    formatDate: (date: string | Date) => String(date),
    formatCurrency: (n: number) => `${n}원`,
    createTheme,
  };
});

// PT API client mock (axios-like)
jest.mock('../api/client', () => {
  const mockClient = {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    apiClient: mockClient,
    default: mockClient,
    API_BASE_URL: 'http://localhost:8000/api/v1',
  };
});

// PT API modules — minimal mocks; individual tests can override
jest.mock('../api/walkers', () => ({
  searchWalkers: jest.fn().mockResolvedValue([]),
  getWalkerProfile: jest.fn().mockResolvedValue({
    id: 'w-1', name: '테스트 산책사', bio: null, experience_years: 3,
    approval_status: 'approved', certification_type: '동물보건사',
    avg_rating: 4.7, total_walks: 25, total_reviews: 12,
    has_insurance: true, insurance_expiry: '2027-04-24', profile_photo_url: null,
  }),
  submitQualification: jest.fn().mockResolvedValue(undefined),
  setAvailability: jest.fn().mockResolvedValue(undefined),
  listAvailability: jest.fn().mockResolvedValue([]),
}));

jest.mock('../api/bookings', () => ({
  createBooking: jest.fn().mockResolvedValue({ id: 'b-1', status: 'pending' }),
  cancelBooking: jest.fn().mockResolvedValue(undefined),
  listBookings: jest.fn().mockResolvedValue([]),
  acceptBooking: jest.fn().mockResolvedValue({ id: 'b-1', status: 'confirmed' }),
}));

jest.mock('../api/pets', () => ({
  createPet: jest.fn().mockResolvedValue({ id: 'p-1' }),
  listPets: jest.fn().mockResolvedValue([]),
}));

jest.mock('../api/walks', () => ({
  startWalk: jest.fn().mockResolvedValue({ session_id: 's-1' }),
  endWalk: jest.fn().mockResolvedValue({ duration_minutes: 30 }),
  postGps: jest.fn().mockResolvedValue(undefined),
  getActiveSession: jest.fn().mockResolvedValue(null),
  updateMemo: jest.fn().mockResolvedValue(undefined),
  getWalkReport: jest.fn().mockResolvedValue({
    session_id: 's-1',
    started_at: '2026-04-24T10:00:00Z',
    ended_at: '2026-04-24T10:30:00Z',
    distance_meters: 1500,
    photo_urls: [],
    memo: null,
    route_geojson: null,
  }),
}));

jest.mock('../api/reviews', () => ({
  createReview: jest.fn().mockResolvedValue({ id: 'r-1' }),
  listMyReviews: jest.fn().mockResolvedValue([]),
  replyReview: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../api/wallet', () => ({
  getWallet: jest.fn().mockResolvedValue({ balance: 0, monthly_earnings: 0 }),
  withdraw: jest.fn().mockResolvedValue(undefined),
}));

// i18n pass-through
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ko', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Silence act() warnings
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return;
  originalConsoleError.call(console, ...args);
};

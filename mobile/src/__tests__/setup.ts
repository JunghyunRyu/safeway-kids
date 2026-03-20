// ── Global test mocks ─────────────────────────────────────────

// Mock react-native-webview
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: (props: any) => React.createElement('View', props),
    default: (props: any) => React.createElement('View', props),
  };
});

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'http://localhost:8000/api/v1',
      },
    },
  },
}));

// Mock expo-notifications
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

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: false,
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const MockIcon = (props: any) => React.createElement('Text', props, props.name);
  return {
    Ionicons: Object.assign(MockIcon, { glyphMap: {} }),
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useFocusEffect: (cb: () => void) => {
      const React2 = require('react');
      React2.useEffect(() => { cb(); }, []);
    },
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  const Tab = {
    Navigator: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    Screen: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
  return {
    createBottomTabNavigator: () => Tab,
  };
});

// Mock react-native-screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock the API client
jest.mock('../api/client', () => {
  const mockClient = {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockClient,
    tokenStorage: {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
      deleteItem: jest.fn().mockResolvedValue(undefined),
    },
    API_BASE_URL: 'http://localhost:8000/api/v1',
    refreshAccessToken: jest.fn().mockResolvedValue(null),
  };
});

// Mock API modules
jest.mock('../api/auth', () => ({
  devLogin: jest.fn().mockResolvedValue({
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
  }),
  getMe: jest.fn().mockResolvedValue({
    id: 'user-1',
    role: 'parent',
    phone: '01033333333',
    name: '박보호자',
  }),
  isLoggedIn: jest.fn().mockResolvedValue(false),
  logout: jest.fn().mockResolvedValue(undefined),
  sendOtp: jest.fn().mockResolvedValue(undefined),
  verifyOtp: jest.fn().mockResolvedValue({
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    token_type: 'bearer',
    expires_in: 3600,
  }),
}));

jest.mock('../api/students', () => ({
  listStudents: jest.fn().mockResolvedValue([]),
  getStudent: jest.fn().mockResolvedValue(null),
  listEnrollments: jest.fn().mockResolvedValue([]),
}));

jest.mock('../api/schedules', () => ({
  listDailySchedules: jest.fn().mockResolvedValue([]),
  getDriverDailySchedules: jest.fn().mockResolvedValue([]),
  listTemplates: jest.fn().mockResolvedValue([]),
  markBoarded: jest.fn().mockResolvedValue({}),
  markAlighted: jest.fn().mockResolvedValue({}),
  cancelSchedule: jest.fn().mockResolvedValue({}),
}));

jest.mock('../api/billing', () => ({
  getMyInvoices: jest.fn().mockResolvedValue([]),
  getInvoicesByAcademy: jest.fn().mockResolvedValue([]),
  markInvoicePaid: jest.fn().mockResolvedValue({}),
  generateInvoices: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../api/vehicles', () => ({
  getMyAssignment: jest.fn().mockResolvedValue(null),
  getVehicleLocation: jest.fn().mockResolvedValue(null),
  updateGps: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../api/escort', () => ({
  getMyShifts: jest.fn().mockResolvedValue([]),
  getMyAvailability: jest.fn().mockResolvedValue([]),
  registerAvailability: jest.fn().mockResolvedValue({}),
  checkIn: jest.fn().mockResolvedValue({}),
  checkOut: jest.fn().mockResolvedValue({}),
}));

jest.mock('../api/routes', () => ({
  getMyRoute: jest.fn().mockResolvedValue(null),
}));

jest.mock('../api/notifications', () => ({
  registerFcmToken: jest.fn().mockResolvedValue(undefined),
}));

// Mock i18n — provide pass-through translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'ko', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
}));

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', role: 'parent', phone: '01033333333', name: '박보호자' },
    authenticated: true,
    loading: false,
    onLoginSuccess: jest.fn(),
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock useNotifications hook
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: jest.fn().mockReturnValue({ expoPushToken: null }),
}));

// Silence console.error for act() warnings (runs at module load time)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) return;
  originalConsoleError.call(console, ...args);
};

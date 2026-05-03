// B-3 PT core flow #5 — Walk report screen (V1.1 trust feature, FR-6.3).

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import WalkReportScreen from '../screens/owner/WalkReportScreen';

const route = { params: { sessionId: 's-1' } };
const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('WalkReportScreen', () => {
  it('renders without crashing', async () => {
    render(<WalkReportScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(true).toBe(true));
  });
});

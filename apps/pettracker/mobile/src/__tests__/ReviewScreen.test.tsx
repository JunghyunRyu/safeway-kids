// B-3 PT core flow #6 — Review screen smoke.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ReviewScreen from '../screens/owner/ReviewScreen';

const route = { params: { bookingId: 'b-1', walkerId: 'w-1' } };
const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('ReviewScreen', () => {
  it('renders without crashing', async () => {
    render(<ReviewScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(true).toBe(true));
  });
});

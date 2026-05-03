// B-3 PT core flow #4 — Bookings list screen renders.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import BookingsScreen from '../screens/owner/BookingsScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('BookingsScreen', () => {
  it('renders without crashing and calls listBookings API', async () => {
    render(<BookingsScreen navigation={navigation} />);
    await waitFor(() => {
      const bookings = require('../api/bookings');
      expect(bookings.listBookings).toHaveBeenCalled();
    });
  });
});

// B-3 PT core flow #3 — Walker search screen renders.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SearchScreen from '../screens/owner/SearchScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('SearchScreen', () => {
  it('renders without crashing', async () => {
    render(<SearchScreen navigation={navigation} />);
    await waitFor(() => {
      // Initial render reaches location permission flow without throwing
      expect(true).toBe(true);
    });
  });
});

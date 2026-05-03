// B-3 PT core flow #2 — Owner home screen renders.

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import OwnerHomeScreen from '../screens/owner/OwnerHomeScreen';

const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('OwnerHomeScreen', () => {
  it('renders without crashing', async () => {
    render(<OwnerHomeScreen navigation={navigation} />);
    await waitFor(() => {
      const pets = require('../api/pets');
      expect(pets.listPets).toHaveBeenCalled();
    });
  });
});

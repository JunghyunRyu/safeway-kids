import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RootNavigator from '../navigation/RootNavigator';

describe('RootNavigator', () => {
  it('renders without crashing', () => {
    expect(() => render(<RootNavigator />)).not.toThrow();
  });
});

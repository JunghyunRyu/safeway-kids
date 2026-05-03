// B-3 PT core flow #1 — Walker profile insurance badge (Milestone A-1).

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import WalkerProfileDetailScreen from '../screens/owner/WalkerProfileDetailScreen';

const route = { params: { walkerId: 'w-1' } };
const navigation = { navigate: jest.fn(), goBack: jest.fn() };

describe('WalkerProfileDetailScreen — insurance badge (Milestone A-1)', () => {
  it('renders without crashing', async () => {
    render(<WalkerProfileDetailScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(screen.getByText('테스트 산책사')).toBeTruthy());
  });

  it('shows walker name and certification badge', async () => {
    render(<WalkerProfileDetailScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(screen.getByText('테스트 산책사')).toBeTruthy());
    expect(screen.getByText('동물보건사')).toBeTruthy();
  });

  it('shows insurance badge when has_insurance=true and expiry is far enough', async () => {
    render(<WalkerProfileDetailScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(screen.getByText('보험 가입')).toBeTruthy());
  });

  it('shows total walks badge when threshold met', async () => {
    render(<WalkerProfileDetailScreen route={route} navigation={navigation} />);
    await waitFor(() => expect(screen.getByText(/25회 완료/)).toBeTruthy());
  });
});

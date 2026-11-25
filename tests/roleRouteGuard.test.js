import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { RoleRouteGuard } from '../src/components/navigation/RoleRouteGuard';

let mockRole = 'praktikan';

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ role: mockRole }),
}));

jest.mock('expo-router', () => {
  const ReactModule = require('react');
  const { Text: NativeText } = require('react-native');
  return {
    Redirect: ({ href }) => ReactModule.createElement(
      NativeText,
      { testID: 'redirect' },
      href,
    ),
  };
});

describe('RoleRouteGuard', () => {
  test('keeps backward compatibility with a single allowed role', async () => {
    mockRole = 'aslab';
    const screen = await render(
      <RoleRouteGuard allowedRole="aslab">
        <Text>Konten Aslab</Text>
      </RoleRouteGuard>,
    );

    expect(screen.getByText('Konten Aslab')).toBeTruthy();
    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  test('accepts any role included in an allowed-role array', async () => {
    mockRole = 'asisten';
    const screen = await render(
      <RoleRouteGuard allowedRole={['asisten', 'aslab']}>
        <Text>Rekap Bersama</Text>
      </RoleRouteGuard>,
    );

    expect(screen.getByText('Rekap Bersama')).toBeTruthy();
  });

  test('redirects missing or unauthorized roles', async () => {
    mockRole = 'praktikan';
    const unauthorized = await render(
      <RoleRouteGuard allowedRole="aslab">
        <Text>Rahasia</Text>
      </RoleRouteGuard>,
    );
    expect(unauthorized.getByTestId('redirect').props.children).toBe('/(tabs)');

    await unauthorized.unmount();
    mockRole = null;
    const missing = await render(
      <RoleRouteGuard allowedRole="aslab">
        <Text>Rahasia</Text>
      </RoleRouteGuard>,
    );
    expect(missing.getByTestId('redirect')).toBeTruthy();
  });
});

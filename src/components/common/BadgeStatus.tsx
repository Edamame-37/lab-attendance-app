/**
 * @file src/components/common/BadgeStatus.tsx
 * @description Komponen badge status sesi praktikum (DIBUKA, DITUTUP, SELESAI).
 * Memberikan indikator visual beserta ikon vektor Ionicons yang konsisten
 * di seluruh antarmuka aplikasi tanpa menggunakan simbol emoji.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusSesi } from '@/types';

export interface BadgeStatusProps {
  status: StatusSesi;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

interface BadgeVisualConfig {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  containerStyle: ViewStyle;
  textStyle: object;
}

export const BadgeStatus: React.FC<BadgeStatusProps> = ({
  status,
  showIcon = true,
  size = 'md',
  style,
}) => {
  const getBadgeConfig = (): BadgeVisualConfig => {
    switch (status) {
      case 'DIBUKA':
        return {
          label: 'SESI DIBUKA',
          iconName: 'radio-button-on',
          iconColor: '#4ade80',
          containerStyle: styles.badgeOpen,
          textStyle: styles.textOpen,
        };
      case 'DITUTUP':
        return {
          label: 'SESI DITUTUP',
          iconName: 'lock-closed-outline',
          iconColor: '#f87171',
          containerStyle: styles.badgeClosed,
          textStyle: styles.textClosed,
        };
      case 'SELESAI':
        return {
          label: 'SELESAI',
          iconName: 'checkmark-done-outline',
          iconColor: '#94a3b8',
          containerStyle: styles.badgeDone,
          textStyle: styles.textDone,
        };
      default:
        return {
          label: status,
          iconName: 'information-circle-outline',
          iconColor: '#f87171',
          containerStyle: styles.badgeClosed,
          textStyle: styles.textClosed,
        };
    }
  };

  const config = getBadgeConfig();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badgeBase,
        isSmall && styles.badgeSmall,
        config.containerStyle,
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.iconName}
          size={isSmall ? 10 : 12}
          color={config.iconColor}
        />
      )}
      <Text
        style={[
          styles.textBase,
          isSmall && styles.textSmall,
          config.textStyle,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  textBase: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textSmall: {
    fontSize: 10,
  },
  badgeOpen: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  textOpen: {
    color: '#4ade80',
  },
  badgeClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  textClosed: {
    color: '#f87171',
  },
  badgeDone: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: '#64748b',
  },
  textDone: {
    color: '#94a3b8',
  },
});

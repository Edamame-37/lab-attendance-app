/**
 * @file src/components/common/BadgeStatus.tsx
 * @description Komponen badge status sesi praktikum (DIBUKA, DITUTUP, SELESAI).
 * Memberikan indikator visual yang konsisten di seluruh antarmuka aplikasi tanpa emoji.
 */

import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { StatusSesi } from '@/types';

export interface BadgeStatusProps {
  status: StatusSesi;
  style?: ViewStyle;
}

export const BadgeStatus: React.FC<BadgeStatusProps> = ({ status, style }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'DIBUKA':
        return {
          label: 'SESI DIBUKA',
          containerStyle: styles.badgeOpen,
          textStyle: styles.textOpen,
        };
      case 'DITUTUP':
        return {
          label: 'SESI DITUTUP',
          containerStyle: styles.badgeClosed,
          textStyle: styles.textClosed,
        };
      case 'SELESAI':
        return {
          label: 'SELESAI',
          containerStyle: styles.badgeDone,
          textStyle: styles.textDone,
        };
      default:
        return {
          label: status,
          containerStyle: styles.badgeClosed,
          textStyle: styles.textClosed,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badgeBase, config.containerStyle, style]}>
      <Text style={[styles.textBase, config.textStyle]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  textBase: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
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

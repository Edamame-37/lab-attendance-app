/**
 * @file src/components/common/EmptyState.tsx
 * @description Komponen antarmuka ketika data atau daftar dalam keadaan kosong.
 * Menggunakan ikon vektor Ionicons tanpa simbol emoji serta mendukung informasi tambahan dan tombol aksi.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface EmptyStateProps {
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  secondaryInfo?: string;
  actionText?: string;
  actionIconName?: keyof typeof Ionicons.glyphMap;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'file-tray-outline',
  title,
  description,
  secondaryInfo,
  actionText,
  actionIconName = 'refresh-outline',
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={34} color="#64748b" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {secondaryInfo && (
        <View style={styles.secondaryBadge}>
          <Ionicons name="information-circle-outline" size={13} color="#38bdf8" />
          <Text style={styles.secondaryText}>{secondaryInfo}</Text>
        </View>
      )}

      {actionText && onActionPress && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          activeOpacity={0.8}
        >
          <Ionicons name={actionIconName} size={15} color="#ffffff" />
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a101f',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  secondaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  secondaryText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});

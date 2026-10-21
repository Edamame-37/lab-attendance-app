/**
 * @file SectionCard.tsx
 * @description Komponen kartu seksi untuk mengelompokkan materi dan latihan praktikum.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

export interface SectionCardProps {
  /** Judul seksi */
  title: string;
  /** Deskripsi singkat atau konsep yang dipelajari */
  subtitle?: string;
  /** Elemen konten di dalam kartu */
  children: ReactNode;
  /** Styling tambahan untuk kartu */
  style?: ViewStyle;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  children,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  body: {
    width: '100%',
  },
});

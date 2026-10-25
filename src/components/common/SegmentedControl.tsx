/**
 * @file src/components/common/SegmentedControl.tsx
 * @description Komponen kontrol tersegmentasi (Segmented Control) native untuk mobile.
 *
 * Menggantikan tombol status terpisah dengan satu lintasan kontinu (continuous track)
 * bersudut lengkung halus (8-10px) dan pil aktif terangkat (elevated pill).
 * Mencegah AI-slop disjointed buttons dan menjamin area sentuh yang ergonomis (min 40px).
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { radius } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export interface SegmentedControlProps<T extends string> {
  /** Daftar opsi yang ditampilkan pada lintasan */
  options: SegmentOption<T>[];
  /** Nilai yang sedang terpilih */
  selectedValue: T;
  /** Callback saat pengguna memilih opsi */
  onSelect: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onSelect,
}: SegmentedControlProps<T>) {
  const { tema, modeTema } = useApp();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: tema.surfaceRaised,
          borderColor: tema.border,
        },
      ]}
    >
      {options.map((option) => {
        const isActive = option.value === selectedValue;

        // Gaya dinamis untuk tombol aktif berdasarkan tema
        const activeContainerStyle = isActive
          ? modeTema === 'dark'
            ? {
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.accent,
                borderWidth: 1,
              }
            : {
                backgroundColor: tema.surface,
                borderColor: tema.border,
                borderWidth: 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              }
          : {
              backgroundColor: 'transparent',
              borderColor: 'transparent',
              borderWidth: 1,
            };

        // Warna teks dan ikon
        const textColor = isActive
          ? modeTema === 'dark'
            ? '#FFFFFF'
            : tema.textPrimary
          : tema.textSecondary;

        const iconColor = isActive
          ? modeTema === 'dark'
            ? tema.accent
            : tema.accent
          : tema.textMuted;

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segmentButton, activeContainerStyle]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            {option.iconName && (
              <Ionicons
                name={option.iconName}
                size={16}
                color={iconColor}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: textColor,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 8,
    minHeight: 40,
  },
  icon: {
    marginRight: 6,
  },
  segmentLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});

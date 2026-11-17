// src/components/common/AIBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AIBadge = ({ category, confidence, isFallback }) => {
  const getColorScheme = () => {
    if (isFallback || category === 'Perlu Verifikasi Manual') {
      return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
    }
    switch (category?.toLowerCase()) {
      case 'sakit':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'acara keluarga':
      case 'keluarga':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' };
      case 'dispensasi':
      case 'akademik':
        return { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  const scheme = getColorScheme();
  const formattedConfidence =
    typeof confidence === 'number' ? ` (${Math.round(confidence * 100)}%)` : '';

  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg, borderColor: scheme.border }]}>
      <Text style={[styles.badgeText, { color: scheme.text }]}>
        Prediksi AI: {category || 'Lainnya'}
        {formattedConfidence}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AIBadge = ({ category, experimental }) => {
  const schemes = {
    positif: { bg: '#D1FAE5', text: '#065F46' },
    netral: { bg: '#F3F4F6', text: '#374151' },
    negatif: { bg: '#FEE2E2', text: '#991B1B' },
  };

  const validCategory = category?.toLowerCase();
  const scheme = schemes[validCategory];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: scheme?.bg || '#FEF3C7' },
      ]}
    >
      <Text style={[styles.text, { color: scheme?.text || '#92400E' }]}>
        {scheme
          ? `Sentimen EDOM: ${validCategory}`
          : 'Tidak dapat diklasifikasikan — verifikasi manual'}
        {experimental ? ' (Eksperimental)' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

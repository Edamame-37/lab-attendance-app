
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AIBadge = ({ category, status, experimental }) => {
  if (!category && !status) return null;

  const normalized = category?.toLowerCase();

  const sentiment = {
    positif: {
      label: 'Positif',
      bg: '#D1FAE5',
      text: '#065F46',
      border: '#6EE7B7',
    },
    netral: {
      label: 'Netral',
      bg: '#FEF3C7',
      text: '#92400E',
      border: '#FCD34D',
    },
    negatif: {
      label: 'Negatif',
      bg: '#FEE2E2',
      text: '#991B1B',
      border: '#FCA5A5',
    },
  };

  const scheme = sentiment[normalized];

  if (!scheme) {
    return (
      <View style={[styles.badge, styles.fallback]}>
        <Text style={[styles.text, { color: '#92400E' }]}>
          Sentimen EDOM: Perlu Verifikasi Manual
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
        },
      ]}
    >
      <Text style={[styles.text, { color: scheme.text }]}>
        Sentimen EDOM: {scheme.label}
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
    borderWidth: 1,
    marginVertical: 6,
  },
  fallback: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

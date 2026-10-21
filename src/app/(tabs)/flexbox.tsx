/**
 * @file src/app/(tabs)/flexbox.tsx
 * @description Modul Pembelajaran 2: Flexbox Layout Interaktif
 * Referensi: https://reactnative.dev/docs/flexbox?language=javascript
 *
 * Konsep Inti yang Dipelajari:
 * 1. flexDirection: Menentukan arah sumbu utama (main axis) -> 'row' | 'column'.
 * 2. justifyContent: Penyelarasan elemen pada main axis -> 'flex-start' | 'center' | 'space-between' | dll.
 * 3. alignItems: Penyelarasan elemen pada cross axis -> 'flex-start' | 'center' | 'stretch' | dll.
 * 4. gap: Jarak antar item flexbox tanpa margin manual.
 */

import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';

type FlexDirectionType = 'row' | 'column' | 'row-reverse';
type JustifyContentType =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around';
type AlignItemsType = 'flex-start' | 'center' | 'flex-end' | 'stretch';

export default function FlexboxScreen(): React.JSX.Element {
  // State interaktif untuk mengontrol properti Flexbox secara live
  const [direction, setDirection] = useState<FlexDirectionType>('row');
  const [justify, setJustify] = useState<JustifyContentType>('center');
  const [align, setAlign] = useState<AlignItemsType>('center');

  const directions: FlexDirectionType[] = ['row', 'column', 'row-reverse'];
  const justifyOptions: JustifyContentType[] = [
    'flex-start',
    'center',
    'flex-end',
    'space-between',
    'space-around',
  ];
  const alignOptions: AlignItemsType[] = [
    'flex-start',
    'center',
    'flex-end',
    'stretch',
  ];

  return (
    <ScreenContainer
      badge="Modul 2"
      title="Flexbox Layout"
      description="Simulator interaktif untuk memahami cara kerja tata letak Flexbox pada React Native."
      docUrl="https://reactnative.dev/docs/flexbox"
    >
      {/* Seksi 1: Playground Visualisasi */}
      <SectionCard
        title="1. Playground Visual"
        subtitle={`Kombinasi aktif: flexDirection: '${direction}', justifyContent: '${justify}', alignItems: '${align}'`}
      >
        <View
          style={[
            styles.playgroundBox,
            {
              flexDirection: direction,
              justifyContent: justify,
              alignItems: align,
            },
          ]}
        >
          <View style={[styles.boxItem, styles.box1]}>
            <Text style={styles.boxText}>Kotak 1</Text>
          </View>
          <View style={[styles.boxItem, styles.box2]}>
            <Text style={styles.boxText}>Kotak 2</Text>
          </View>
          <View style={[styles.boxItem, styles.box3]}>
            <Text style={styles.boxText}>Kotak 3</Text>
          </View>
        </View>
      </SectionCard>

      {/* Seksi 2: Kontrol Interaktif FlexDirection */}
      <SectionCard
        title="2. Atur flexDirection (Main Axis)"
        subtitle="Menentukan orientasi susunan komponen anak."
      >
        <View style={styles.pillRow}>
          {directions.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.pill, direction === d && styles.pillActive]}
              onPress={() => setDirection(d)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, direction === d && styles.pillTextActive]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>

      {/* Seksi 3: Kontrol Interaktif JustifyContent */}
      <SectionCard
        title="3. Atur justifyContent"
        subtitle="Mendistribusikan ruang kosong di sepanjang sumbu utama."
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pillRow}>
            {justifyOptions.map((j) => (
              <TouchableOpacity
                key={j}
                style={[styles.pill, justify === j && styles.pillActive]}
                onPress={() => setJustify(j)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.pillText, justify === j && styles.pillTextActive]}
                >
                  {j}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SectionCard>

      {/* Seksi 4: Kontrol Interaktif AlignItems */}
      <SectionCard
        title="4. Atur alignItems (Cross Axis)"
        subtitle="Menyelaraskan komponen pada sumbu tegak lurus."
      >
        <View style={styles.pillRow}>
          {alignOptions.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.pill, align === a && styles.pillActive]}
              onPress={() => setAlign(a)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.pillText, align === a && styles.pillTextActive]}
              >
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  playgroundBox: {
    backgroundColor: '#0a0f1d',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    minHeight: 220,
    padding: 12,
    gap: 10,
  },
  boxItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  box1: {
    backgroundColor: '#ef4444', // Red
  },
  box2: {
    backgroundColor: '#10b981', // Emerald
  },
  box3: {
    backgroundColor: '#f59e0b', // Amber
  },
  boxText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  pillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
  },
});

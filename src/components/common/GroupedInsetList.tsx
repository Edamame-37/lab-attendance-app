/**
 * @file src/components/common/GroupedInsetList.tsx
 * @description Komponen daftar berkelompok berbingkai tunggal (Grouped Inset List).
 *
 * Menerapkan prinsip Apple iOS Inset List & Material 3 List:
 * - Menyatukan baris data sekunder dalam satu wadah berbingkai tunggal (border-radius 12px).
 * - Menghilangkan nesting card ganda ("box-in-a-box syndrome") dan border berat.
 * - Pembatas halus 1px antar baris data (borderSubtle).
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

/**
 * Properti untuk header seksi yang lapang dan bernapas.
 */
export interface SectionHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  isFirst?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  rightElement,
  style,
  isFirst = false,
}) => {
  const { tema } = useApp();

  return (
    <View
      style={[
        styles.sectionHeader,
        isFirst ? styles.sectionHeaderFirst : null,
        style,
      ]}
    >
      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>
        {title}
      </Text>
      {rightElement}
    </View>
  );
};

/**
 * Properti untuk wadah utama Grouped Inset List.
 */
export interface GroupedInsetListProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GroupedInsetList: React.FC<GroupedInsetListProps> = ({
  children,
  style,
}) => {
  const { tema } = useApp();

  return (
    <View
      style={[
        styles.listContainer,
        {
          backgroundColor: tema.surface,
          borderColor: tema.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

/**
 * Properti untuk setiap baris data di dalam Grouped Inset List.
 */
export interface GroupedInsetItemProps {
  title: string;
  subtitle?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const GroupedInsetItem: React.FC<GroupedInsetItemProps> = ({
  title,
  subtitle,
  leftElement,
  rightElement,
  onPress,
  isLast = false,
  style,
}) => {
  const { tema } = useApp();

  const content = (
    <View
      style={[
        styles.itemContainer,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: tema.borderSubtle,
        },
        style,
      ]}
    >
      {leftElement && <View style={styles.leftContainer}>{leftElement}</View>}

      <View style={styles.contentContainer}>
        <Text
          style={[styles.itemTitle, { color: tema.textPrimary }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.itemSubtitle, { color: tema.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement && (
        <View style={styles.rightContainer}>{rightElement}</View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: spacing.xs,
  },
  sectionHeaderFirst: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  listContainer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContainer: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  leftContainer: {
    marginRight: 2,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  rightContainer: {
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

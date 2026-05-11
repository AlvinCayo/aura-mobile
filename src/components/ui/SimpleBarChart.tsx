import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface BarData {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
}

export default function SimpleBarChart({ data, maxValue, height = 140 }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.container, { height }]}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * (height - 20);
        return (
          <View key={index} style={styles.barGroup}>
            <Text style={styles.valueText}>{item.value}</Text>
            <View style={[styles.bar, { height: barHeight }]} />
            <Text style={styles.labelText}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  valueText: {
    fontSize: 11,
    color: AuraColors.textSecondary,
    marginBottom: 4,
  },
  bar: {
    width: '80%',
    backgroundColor: AuraColors.primary,
    borderRadius: 6,
    minHeight: 4,
  },
  labelText: {
    fontSize: 10,
    color: AuraColors.textMuted,
    marginTop: 4,
  },
});
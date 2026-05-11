import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface Step {
  id: number;
  label?: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  showLabels?: boolean;
}

export default function ProgressSteps({
  steps,
  currentStep,
  showLabels = true,
}: ProgressStepsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View
              style={[
                styles.dot,
                step.id <= currentStep && styles.dotActive,
              ]}
            >
              {step.id < currentStep && (
                <Feather name="check" size={10} color="white" />
              )}
              {step.id === currentStep && (
                <View style={styles.currentDotInner} />
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  step.id < currentStep && styles.lineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
      {showLabels && (
        <View style={styles.labelsRow}>
          {steps.map((step) => (
            <Text
              key={step.id}
              style={[
                styles.label,
                step.id === currentStep && styles.labelActive,
              ]}
            >
              {step.label || `Paso ${step.id}`}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    backgroundColor: AuraColors.primary,
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  line: {
    width: 40,
    height: 3,
    backgroundColor: AuraColors.border,
    marginHorizontal: 4,
    borderRadius: 2,
  },
  lineActive: {
    backgroundColor: AuraColors.primary,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
    color: AuraColors.textMuted,
    textAlign: 'center',
    flex: 1,
  },
  labelActive: {
    color: AuraColors.primary,
    fontWeight: '600',
  },
});
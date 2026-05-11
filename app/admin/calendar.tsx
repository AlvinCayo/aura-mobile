import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOURS = ['9:00', '10:00', '11:00', '12:00', '13:00', '17:00'];
const APPOINTMENTS = [
  { day: 15, hour: '10:00', client: 'María G.', service: 'Limpieza' },
  { day: 15, hour: '12:00', client: 'Carlos L.', service: 'Masaje' },
];

export default function CenterCalendarScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Calendario</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            <View style={styles.emptyCorner} />
            {DAYS.map((day) => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </View>
          {HOURS.map((hour) => (
            <View key={hour} style={styles.row}>
              <View style={styles.hourCell}>
                <Text style={styles.hourText}>{hour}</Text>
              </View>
              {DAYS.map((_, idx) => {
                const appt = APPOINTMENTS.find((a) => a.hour === hour && a.day === 15 + idx);
                return (
                  <View key={idx} style={[styles.cell, appt && styles.cellOccupied]}>
                    {appt && <Text style={styles.apptText}>{appt.client}</Text>}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  calendarScroll: { flex: 1 },
  calendar: { minWidth: 600 },
  weekRow: { flexDirection: 'row' },
  emptyCorner: { width: 70 },
  dayHeader: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  dayText: { fontWeight: '600', color: AuraColors.textPrimary },
  row: { flexDirection: 'row', height: 50 },
  hourCell: { width: 70, justifyContent: 'center' },
  hourText: { color: AuraColors.textMuted, fontSize: 13 },
  cell: { flex: 1, borderWidth: 0.5, borderColor: AuraColors.border, justifyContent: 'center', alignItems: 'center', backgroundColor: AuraColors.card },
  cellOccupied: { backgroundColor: AuraColors.primaryLight },
  apptText: { fontSize: 11, color: AuraColors.primary, fontWeight: '600' },
});
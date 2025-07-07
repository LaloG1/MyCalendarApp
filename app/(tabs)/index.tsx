import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const markedDates = {
    [today]: {
      marked: true,
      dotColor: 'red',
    },
    [selectedDate]: {
      selected: true,
      selectedColor: '#00adf5',
    },
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bienvenido a My Calendar!</ThemedText>
        <HelloWave />
      </ThemedView>

      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          console.log('Día seleccionado:', day.dateString);
        }}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#00adf5',
          todayTextColor: '#00adf5',
          arrowColor: 'orange',
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
  },
});

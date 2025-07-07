import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function HomeScreen() {
  const db = useSQLiteContext();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [empleadosDelDia, setEmpleadosDelDia] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [empleados, setEmpleados] = useState<{ id: number; nombre: string }[]>(
    []
  );
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<
    number | null
  >(null);

  const [vacacionesPorFecha, setVacacionesPorFecha] = useState<
    Record<string, number>
  >({});

  const toggleDate = (dateString: string) => {
    setSelectedDates(
      (prev) =>
        prev.includes(dateString)
          ? prev.filter((d) => d !== dateString) // quitar si ya está
          : [...prev, dateString] // agregar si no está
    );
  };

  // ✅ Cargar empleados
  const cargarEmpleados = async () => {
    const result = await db.getAllAsync<{ id: number; nombre: string }>(
      `SELECT id, nombre FROM empleados ORDER BY nombre`
    );
    setEmpleados(result);
  };

  // ✅ Cargar vacaciones agrupadas por fecha
  const cargarVacaciones = async () => {
    const result = await db.getAllAsync<{ fecha: string; total: number }>(
      `SELECT fecha, COUNT(*) as total FROM vacaciones GROUP BY fecha`
    );
    const vacs: Record<string, number> = {};
    result.forEach((row) => {
      vacs[row.fecha] = row.total;
    });
    setVacacionesPorFecha(vacs);
  };

  // ✅ Guardar vacación
  const guardarVacacion = async () => {
    if (!empleadoSeleccionado || selectedDates.length === 0) {
      Alert.alert("Error", "Selecciona un empleado y al menos una fecha");
      return;
    }

    try {
      const insertPromises = selectedDates.map((fecha) =>
        db.runAsync(
          `INSERT INTO vacaciones (empleado_id, fecha) VALUES (?, ?)`,
          [empleadoSeleccionado, fecha]
        )
      );

      await Promise.all(insertPromises);

      Alert.alert("Éxito", "Vacaciones agendadas");
      setShowForm(false);
      setEmpleadoSeleccionado(null);
      setBusqueda("");
      setSelectedDates([]);
      cargarVacaciones();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "No se pudieron guardar las vacaciones");
    }
  };

  useEffect(() => {
    cargarVacaciones();
  }, []);

  useEffect(() => {
    if (showForm) {
      cargarEmpleados();
    }
  }, [showForm]);

  // ✅ Cargar empleados con vacaciones en una fecha específica
  const cargarEmpleadosDelDia = async (fecha: string) => {
    const result = await db.getAllAsync<{ nombre: string }>(
      `SELECT e.nombre FROM vacaciones v JOIN empleados e ON v.empleado_id = e.id WHERE v.fecha = ?`,
      [fecha]
    );
    setEmpleadosDelDia(result.map((row) => row.nombre));
  };

  // ✅ Generar los días marcados
  const markedDates = {
    // 🔴 Colorear días con empleados agendados
    ...Object.entries(vacacionesPorFecha).reduce((acc, [fecha, total]) => {
      if (showForm && selectedDates.includes(fecha)) return acc; // evitar sobrescribir si está en modo edición

      if (total >= 1 && total < 4) {
        acc[fecha] = {
          selected: true,
          selectedColor: "green",
          selectedTextColor: "#fff",
        };
      } else if (total >= 4) {
        acc[fecha] = {
          selected: true,
          selectedColor: "red",
          selectedTextColor: "#fff",
        };
      }
      return acc;
    }, {} as Record<string, any>),

    // 🟦 Mostrar selección activa (solo 1 día si no estás agendando)
    ...(showForm
      ? selectedDates.reduce((acc, date) => {
          acc[date] = {
            selected: true,
            selectedColor: "#00adf5", // azul
            selectedTextColor: "#fff",
          };
          return acc;
        }, {} as Record<string, any>)
      : {
          [selectedDate]: {
            selected: true,
            selectedColor: "#00adf5", // azul para el día seleccionado fuera del modo de agendar
            selectedTextColor: "#fff",
          },
        }),
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
          cargarEmpleadosDelDia(day.dateString); // ← Esto es clave
          if (showForm) {
            toggleDate(day.dateString);
          }
        }}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: "#00adf5",
          todayTextColor: "#00adf5",
          arrowColor: "orange",
        }}
      />

      <View style={styles.botonesAccion}>
        {!showForm ? (
          <Button
            title="+ Agendar vacaciones"
            onPress={() => {
              setShowForm(true);
              setSelectedDates([]);
            }}
          />
        ) : (
          <>
            <Button
              title="Cancelar"
              color="#999"
              onPress={() => {
                setShowForm(false);
                setSelectedDates([]);
                setEmpleadoSeleccionado(null);
                setBusqueda("");
              }}
            />
          </>
        )}
      </View>

      {selectedDate && (
        <View style={styles.listaAgendados}>
          <Text style={styles.label}>
            Empleados con vacaciones el {selectedDate}:
          </Text>
          {empleadosDelDia.length === 0 ? (
            <Text style={{ color: "#666" }}>Nadie aún.</Text>
          ) : (
            <FlatList
              data={empleadosDelDia}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <Text style={styles.empleadoDia}>• {item}</Text>
              )}
            />
          )}
        </View>
      )}

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Selecciona un empleado:</Text>
          <TextInput
            placeholder="Buscar empleado..."
            style={styles.input}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          <FlatList
            data={empleados.filter((e) =>
              e.nombre.toLowerCase().includes(busqueda.toLowerCase())
            )}
            keyExtractor={(item) => item.id.toString()}
            style={styles.lista}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.empleadoItem,
                  empleadoSeleccionado === item.id && {
                    backgroundColor: "#d0f0ff",
                  },
                ]}
                onPress={() => setEmpleadoSeleccionado(item.id)}
              >
                <Text>{item.nombre}</Text>
              </TouchableOpacity>
            )}
          />
          <Button title="Guardar" onPress={guardarVacacion} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
  },
  agendarButton: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  botonesAccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
    gap: 10,
  },
  listaAgendados: {
    marginTop: 20,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  empleadoDia: {
    paddingVertical: 4,
    fontSize: 16,
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
  },
  lista: {
    maxHeight: 150,
    marginBottom: 10,
  },
  empleadoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

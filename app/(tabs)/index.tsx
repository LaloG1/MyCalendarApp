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

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};

LocaleConfig.defaultLocale = "es";

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
    const result = await db.getAllAsync<{
      nombre: string;
      grupo: string;
    }>(
      `SELECT e.nombre, j.nombre as grupo
     FROM vacaciones v
     JOIN empleados e ON e.id = v.empleado_id
     LEFT JOIN jgrupo j ON j.id = e.jgrupo_id
     WHERE v.fecha = ?
     ORDER BY e.nombre`,
      [fecha]
    );

    // Formato: "Empleado - Grupo"
    const lista = result.map((row) =>
      row.grupo ? `${row.nombre} - ${row.grupo}` : row.nombre
    );
    setEmpleadosDelDia(lista);
  };

  // ✅ Generar los días marcados
  const markedDates = {
    ...Object.entries(vacacionesPorFecha).reduce((acc, [fecha, total]) => {
      const isSelected = selectedDates.includes(fecha);

      // Color de fondo según cantidad
      let bgColor = undefined;
      if (total >= 4) bgColor = "red";
      else if (total >= 1) bgColor = "green";

      // Solo aplica customStyles si no está seleccionado manualmente
      if (!showForm || !isSelected) {
        acc[fecha] = {
          customStyles: {
            container: {
              backgroundColor: bgColor || "transparent",
              borderRadius: 10,
            },
            text: {
              color: "#fff",
              fontWeight: "bold",
            },
          },
        };
      }

      return acc;
    }, {} as Record<string, any>),

    // Días seleccionados manualmente (modo agendar)
    ...(showForm
      ? selectedDates.reduce((acc, date) => {
          acc[date] = {
            customStyles: {
              container: {
                backgroundColor: "#00adf5",
                borderRadius: 10,
              },
              text: {
                color: "#fff",
                fontWeight: "bold",
              },
            },
          };
          return acc;
        }, {} as Record<string, any>)
      : {
          [selectedDate]: {
            customStyles: {
              container: {
                backgroundColor: "#00adf5",
                borderRadius: 10,
              },
              text: {
                color: "#fff",
                fontWeight: "bold",
              },
            },
          },
        }),
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">E G M!</ThemedText>
        </ThemedView>

        <Calendar
          markingType="custom"
          markedDates={markedDates}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            cargarEmpleadosDelDia(day.dateString);
            if (showForm) {
              toggleDate(day.dateString);
            }
          }}
          theme={{
            todayTextColor: "#00adf5",
            arrowColor: "orange",
          }}
          style={styles.calendar}
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
              <View style={{ flex: 1 }}>
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
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Button title="Guardar vacaciones" onPress={guardarVacacion} />
              </View>
            </>
          )}
        </View>

        {selectedDate && (
          <View style={styles.listaAgendados}>
            <Text style={styles.label}>Agendados el {selectedDate}:</Text>
            {empleadosDelDia.length === 0 ? (
              <Text style={{ color: "#666" }}>Nadie aún.</Text>
            ) : (
              <FlatList
                data={empleadosDelDia}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <Text style={styles.empleadoDia}>
                    {index + 1}. {item}
                  </Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titleContainer: {
    alignItems: "center", // ⬅️ Esto centra horizontalmente el contenido
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

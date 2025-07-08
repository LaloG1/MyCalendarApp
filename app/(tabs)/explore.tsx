import { Picker } from "@react-native-picker/picker";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  TextInput,
  View
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";


import EmpleadoItem from "@/components/EmpleadoItem";
import GrupoItem from "@/components/GrupoItem";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

export default function TabTwoScreen() {
  const db = useSQLiteContext();

  // Formularios visibles
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false);

  // Mostrar listas
  const [mostrarListaGrupos, setMostrarListaGrupos] = useState(false);
  const [mostrarListaEmpleados, setMostrarListaEmpleados] = useState(false);

  // Datos
  const [grupoNombre, setGrupoNombre] = useState("");
  const [empleadoNombre, setEmpleadoNombre] = useState("");
  const [grupos, setGrupos] = useState<{ id: number; nombre: string }[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(
    null
  );
  const [empleados, setEmpleados] = useState<
    { id: number; nombre: string; grupo: string }[]
  >([]);

  const dbName = "vacaciones.db"; // nombre del archivo SQLite

  useEffect(() => {
    cargarGrupos();
    cargarEmpleados();
  }, []);

  const cargarGrupos = async () => {
    const resultado = await db.getAllAsync<{ id: number; nombre: string }>(
      `SELECT * FROM jgrupo`
    );
    setGrupos(resultado);
    if (resultado.length > 0 && grupoSeleccionado === null) {
      setGrupoSeleccionado(resultado[0].id);
    }
  };

  const cargarEmpleados = async () => {
    const resultado = await db.getAllAsync(
      `SELECT empleados.id, empleados.nombre, jgrupo.nombre as grupo
       FROM empleados
       LEFT JOIN jgrupo ON empleados.jgrupo_id = jgrupo.id`
    );
    setEmpleados(resultado as { id: number; nombre: string; grupo: string }[]);
  };

  const guardarGrupo = async () => {
    if (!grupoNombre.trim())
      return Alert.alert("Error", "El nombre del grupo no puede estar vacío");
    try {
      await db.runAsync(`INSERT INTO jgrupo (nombre) VALUES (?)`, [
        grupoNombre,
      ]);
      setGrupoNombre("");
      setMostrarFormGrupo(false);
      await cargarGrupos();
      Alert.alert("Éxito", "Grupo agregado correctamente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo agregar el grupo");
    }
  };

  const guardarEmpleado = async () => {
    if (!empleadoNombre.trim())
      return Alert.alert(
        "Error",
        "El nombre del empleado no puede estar vacío"
      );
    if (!grupoSeleccionado)
      return Alert.alert("Error", "Selecciona un grupo válido");
    try {
      await db.runAsync(
        `INSERT INTO empleados (nombre, jgrupo_id) VALUES (?, ?)`,
        [empleadoNombre, grupoSeleccionado]
      );
      setEmpleadoNombre("");
      setMostrarFormEmpleado(false);
      await cargarEmpleados();
      Alert.alert("Éxito", "Empleado agregado correctamente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo agregar el empleado");
    }
  };

  const exportarBaseDatos = async () => {
  const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
  const tempExportPath = `${FileSystem.documentDirectory}${dbName}`;

  try {
    // Copia la base de datos a una ubicación temporal para compartir
    await FileSystem.copyAsync({
      from: dbPath,
      to: tempExportPath,
    });

    // Verifica si se puede compartir
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(tempExportPath);
    } else {
      Alert.alert(
        "Compartir no disponible",
        `La base de datos fue copiada a:\n${tempExportPath}`
      );
    }
  } catch (error) {
    console.error(error);
    Alert.alert("Error", "No se pudo exportar ni compartir la base de datos");
  }
};


  const importarBaseDatos = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const fileUri = res.assets[0].uri;
        const destino = `${FileSystem.documentDirectory}SQLite/${dbName}`;
        await FileSystem.copyAsync({
          from: fileUri,
          to: destino,
        });
        Alert.alert("Éxito", "Base de datos importada. Reinicia la app.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo importar la base de datos");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Explore</ThemedText>

      {/* Botón mostrar formulario grupo */}
      <View style={styles.buttonContainer}>
        <Button
          title={mostrarFormGrupo ? "Cancelar" : "Agregar Grupo (jgrupo)"}
          onPress={() => setMostrarFormGrupo(!mostrarFormGrupo)}
        />
      </View>
      {mostrarFormGrupo && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del grupo"
            value={grupoNombre}
            onChangeText={setGrupoNombre}
          />
          <Button title="Guardar Grupo" onPress={guardarGrupo} />
        </View>
      )}

      {/* Botón mostrar formulario empleado */}
      <View style={styles.buttonContainer}>
        <Button
          title={mostrarFormEmpleado ? "Cancelar" : "Agregar Empleado"}
          onPress={() => setMostrarFormEmpleado(!mostrarFormEmpleado)}
        />
      </View>
      {mostrarFormEmpleado && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre del empleado"
            value={empleadoNombre}
            onChangeText={setEmpleadoNombre}
          />
          <Picker
            selectedValue={grupoSeleccionado}
            onValueChange={(value) => setGrupoSeleccionado(value)}
            style={styles.picker}
          >
            {grupos.map((grupo) => (
              <Picker.Item
                key={grupo.id}
                label={grupo.nombre}
                value={grupo.id}
              />
            ))}
          </Picker>
          <Button title="Guardar Empleado" onPress={guardarEmpleado} />
        </View>
      )}

      {/* Botón mostrar lista de grupos */}
      <View style={styles.buttonContainer}>
        <Button
          title={mostrarListaGrupos ? "Ocultar Grupos" : "Ver Grupos"}
          onPress={() => setMostrarListaGrupos(!mostrarListaGrupos)}
        />
      </View>
      {mostrarListaGrupos && (
        <FlatList
          data={grupos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <GrupoItem
              item={item}
              onActualizado={cargarGrupos}
              onEliminado={cargarGrupos}
            />
          )}
        />
      )}

      {/* Botón mostrar lista de empleados */}
      <View style={styles.buttonContainer}>
        <Button
          title={mostrarListaEmpleados ? "Ocultar Empleados" : "Ver Empleados"}
          onPress={() => setMostrarListaEmpleados(!mostrarListaEmpleados)}
        />
      </View>
      {mostrarListaEmpleados && (
        <FlatList
          data={empleados}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EmpleadoItem
              item={item}
              grupos={grupos}
              onActualizado={cargarEmpleados}
              onEliminado={cargarEmpleados}
            />
          )}
        />
      )}

      {/* Botones de exportar/importar BD */}
      <View style={[styles.buttonContainer, { flexDirection: "row", gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Button
            title="Exportar BD"
            color="green"
            onPress={exportarBaseDatos}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Importar BD"
            color="orange"
            onPress={importarBaseDatos}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  formContainer: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  picker: {
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  listItem: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  listItemContainer: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
});

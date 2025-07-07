import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  const db = useSQLiteContext();

  // Formularios visibles
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false);
  const [mostrarFormEmpleado, setMostrarFormEmpleado] = useState(false);

  // Campos del formulario
  const [grupoNombre, setGrupoNombre] = useState('');
  const [empleadoNombre, setEmpleadoNombre] = useState('');
  interface Grupo {
    id: number;
    nombre: string;
  }

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    const resultado = await db.getAllAsync(`SELECT * FROM jgrupo`);
    setGrupos(resultado as Grupo[]);
    if ((resultado as Grupo[]).length > 0 && grupoSeleccionado === null) {
      setGrupoSeleccionado((resultado as Grupo[])[0].id);
    }
  }

  const guardarGrupo = async () => {
    if (!grupoNombre.trim()) return Alert.alert('Error', 'El nombre del grupo no puede estar vacío');
    try {
      await db.runAsync(`INSERT INTO jgrupo (nombre) VALUES (?)`, [grupoNombre]);
      setGrupoNombre('');
      setMostrarFormGrupo(false);
      await cargarGrupos();
      Alert.alert('Éxito', 'Grupo agregado correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo agregar el grupo');
    }
  };

  const guardarEmpleado = async () => {
    if (!empleadoNombre.trim()) return Alert.alert('Error', 'El nombre del empleado no puede estar vacío');
    if (!grupoSeleccionado) return Alert.alert('Error', 'Selecciona un grupo válido');
    try {
      await db.runAsync(
        `INSERT INTO empleados (nombre, jgrupo_id) VALUES (?, ?)`,
        [empleadoNombre, grupoSeleccionado]
      );
      setEmpleadoNombre('');
      setMostrarFormEmpleado(false);
      Alert.alert('Éxito', 'Empleado agregado correctamente');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo agregar el empleado');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>

      {/* Botón mostrar formulario grupo */}
      <View style={styles.buttonContainer}>
        <Button
          title={mostrarFormGrupo ? 'Cancelar' : 'Agregar Grupo (jgrupo)'}
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
          title={mostrarFormEmpleado ? 'Cancelar' : 'Agregar Empleado'}
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
            selectedValue={grupoSeleccionado ?? undefined}
            onValueChange={(value: number, _index: number) => setGrupoSeleccionado(value)}
            style={styles.picker}
            >
            {grupos.map((grupo: Grupo) => (
              <Picker.Item key={grupo.id} label={grupo.nombre} value={grupo.id} />
            ))}
            </Picker>
          <Button title="Guardar Empleado" onPress={guardarEmpleado} />
        </View>
      )}
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
    gap: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  formContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 10,
    height: 44,
  }
  });

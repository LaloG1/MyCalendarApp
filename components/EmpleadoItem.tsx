// components/EmpleadoItem.tsx
import { Picker } from '@react-native-picker/picker';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface EmpleadoItemProps {
  item: {
    id: number;
    nombre: string;
    grupo: string | null;
    jgrupo_id?: number;
  };
  grupos: { id: number; nombre: string }[];
  onActualizado: () => void;
  onEliminado: () => void;
}

const EmpleadoItem: React.FC<EmpleadoItemProps> = ({
  item,
  grupos,
  onActualizado,
  onEliminado,
}) => {
  const db = useSQLiteContext();
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(item.nombre);
  const [nuevoGrupoId, setNuevoGrupoId] = useState<number | null>(
    grupos.find((g) => g.nombre === item.grupo)?.id || null
  );

  const actualizarEmpleado = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    if (!nuevoGrupoId) {
      Alert.alert('Error', 'Selecciona un grupo válido');
      return;
    }

    try {
      await db.runAsync(
        `UPDATE empleados SET nombre = ?, jgrupo_id = ? WHERE id = ?`,
        [nuevoNombre, nuevoGrupoId, item.id]
      );
      setEditando(false);
      onActualizado();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el empleado');
    }
  };

  const eliminarEmpleado = async () => {
    Alert.alert(
      'Eliminar empleado',
      `¿Seguro que deseas eliminar a "${item.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync(`DELETE FROM empleados WHERE id = ?`, [item.id]);
              onEliminado();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar el empleado');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {editando ? (
        <>
          <TextInput
            style={styles.input}
            value={nuevoNombre}
            onChangeText={setNuevoNombre}
          />
          <Picker
            selectedValue={nuevoGrupoId}
            onValueChange={(value) => setNuevoGrupoId(value)}
            style={styles.picker}
          >
            {grupos.map((grupo) => (
              <Picker.Item key={grupo.id} label={grupo.nombre} value={grupo.id} />
            ))}
          </Picker>
          <Button title="Guardar" onPress={actualizarEmpleado} />
          <Button title="Cancelar" onPress={() => setEditando(false)} />
        </>
      ) : (
        <>
          <Text style={styles.text}>
            👤 {item.nombre} — {item.grupo || 'Sin grupo'}
          </Text>
          <View style={styles.actions}>
            <Button title="Editar" onPress={() => setEditando(true)} />
            <Button title="Eliminar" color="red" onPress={eliminarEmpleado} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 0,
    marginBottom: 0,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
});

export default EmpleadoItem;

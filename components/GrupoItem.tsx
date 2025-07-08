// components/GrupoItem.tsx
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

interface GrupoItemProps {
  item: { id: number; nombre: string };
  onActualizado: () => void;
  onEliminado: () => void;
}

const GrupoItem: React.FC<GrupoItemProps> = ({
  item,
  onActualizado,
  onEliminado,
}) => {
  const db = useSQLiteContext();
  const [editando, setEditando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState(item.nombre);

  const actualizarGrupo = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      await db.runAsync(`UPDATE jgrupo SET nombre = ? WHERE id = ?`, [
        nuevoNombre,
        item.id,
      ]);
      setEditando(false);
      onActualizado();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el grupo');
    }
  };

  const eliminarGrupo = async () => {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM empleados WHERE jgrupo_id = ?`,
        item.id
      );
      const count = result?.count ?? 0;

      if (count > 0) {
        return Alert.alert(
          'No permitido',
          `El grupo "${item.nombre}" tiene ${count} empleado(s) asignado(s). Elimínalos o cámbialos de grupo antes.`
        );
      }

      Alert.alert(
        'Eliminar grupo',
        `¿Seguro que deseas eliminar "${item.nombre}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await db.runAsync(`DELETE FROM jgrupo WHERE id = ?`, [item.id]);
              onEliminado();
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo eliminar el grupo');
    }
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
          <Button title="Guardar" onPress={actualizarGrupo} />
          <Button title="Cancelar" onPress={() => setEditando(false)} />
        </>
      ) : (
        <>
          <Text style={styles.text}>📁 {item.nombre}</Text>
          <View style={styles.actions}>
            <Button title="Editar" onPress={() => setEditando(true)} />
            <Button title="Eliminar" color="red" onPress={eliminarGrupo} />
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
  text: {
    fontSize: 16,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 10,
  },
});

export default GrupoItem;

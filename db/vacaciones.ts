// db/vacaciones.ts
import { SQLiteDatabase } from 'expo-sqlite';

export async function openVacacionesDb(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

 await db.execAsync(`
    CREATE TABLE IF NOT EXISTS jgrupo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      jgrupo_id INTEGER,
      FOREIGN KEY (jgrupo_id) REFERENCES jgrupo(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS vacaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
    );
  `);

}

import Database from 'better-sqlite3'
import { app } from 'electron'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

let conexion: Database.Database | null = null

function rutaBaseDeDatos(): string {
  if (process.env.MIALMACEN_DB_PATH) {
    return process.env.MIALMACEN_DB_PATH
  }
  return join(app.getPath('userData'), 'pos_almacen.db')
}

function abrirBaseDeDatos(): Database.Database {
  const ruta = rutaBaseDeDatos()
  mkdirSync(dirname(ruta), { recursive: true })

  const db = new Database(ruta)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  return db
}

function inicializarEsquema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      precio INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      unidad TEXT NOT NULL DEFAULT 'UNIDAD',
      acceso_rapido TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ventas_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      cantidad INTEGER NOT NULL,
      precio_unitario INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      unidad TEXT NOT NULL DEFAULT 'UNIDAD'
    );

    CREATE TABLE IF NOT EXISTS producciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL REFERENCES productos(id),
      gramos INTEGER NOT NULL,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
    CREATE INDEX IF NOT EXISTS idx_detalle_venta ON ventas_detalle(venta_id);
    CREATE INDEX IF NOT EXISTS idx_producciones_producto ON producciones(producto_id);
  `)

  agregarColumnaSiFalta(db, 'productos', 'unidad', "TEXT NOT NULL DEFAULT 'UNIDAD'")
  agregarColumnaSiFalta(db, 'productos', 'acceso_rapido', 'TEXT')
  agregarColumnaSiFalta(db, 'ventas_detalle', 'unidad', "TEXT NOT NULL DEFAULT 'UNIDAD'")
}

function agregarColumnaSiFalta(
  db: Database.Database,
  tabla: string,
  columna: string,
  definicion: string
): void {
  const columnas = db.prepare(`PRAGMA table_info(${tabla})`).all() as { name: string }[]
  if (!columnas.some((c) => c.name === columna)) {
    db.exec(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`)
  }
}

export function getDb(): Database.Database {
  if (!conexion) {
    conexion = abrirBaseDeDatos()
    inicializarEsquema(conexion)
  }
  return conexion
}

export function cerrarDb(): void {
  if (conexion) {
    conexion.close()
    conexion = null
  }
}

export function rutaDb(): string {
  return rutaBaseDeDatos()
}

export async function respaldar(destino: string): Promise<void> {
  await getDb().backup(destino)
}

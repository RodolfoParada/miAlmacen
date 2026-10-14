#Elementos

#Base de datos local (dentro del proyecto)
better-sqlite3 (y @types/better-sqlite3): La opción más rápida y síncrona para SQLite embebido en Node.js/Electron.

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'pos_almacen.db');
export const db = new Database(dbPath);

// Inicializar esquema
db.exec(`
  CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    precio INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER REFERENCES ventas(id),
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
  );
`);.

Implementar la transacción de venta con descuento de stock
export const procesarVenta = db.transaction((items: { id: number; cantidad: number; subtotal: number }[], total: number) => {
  const venta = db.prepare('INSERT INTO ventas (total) VALUES (?)').run(total);
  const ventaId = venta.lastInsertRowid;

  const descontarStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
  const insertarDetalle = db.prepare('INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, subtotal) VALUES (?, ?, ?, ?)');

  for (const item of items) {
    descontarStock.run(item.cantidad, item.id);
    insertarDetalle.run(ventaId, item.id, item.cantidad, item.subtotal);
  }

  return { success: true, ventaId };
});


conectar con React con las funciones de base de datos a través de contextBridge
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  buscarProducto: (codigo: string) => ipcRenderer.invoke('db:buscar-producto', codigo),
  guardarProducto: (producto: any) => ipcRenderer.invoke('db:guardar-producto', producto),
  ejecutarVenta: (datos: any) => ipcRenderer.invoke('db:ejecutar-venta', datos),
  imprimirEtiqueta: (codigo: string, nombre: string) => ipcRenderer.invoke('printer:imprimir-etiqueta', { codigo, nombre })
});

configuración multiplataforma
"build": {
  "appId": "com.almacen.pos",
  "productName": "ScanPOS",
  "directories": {
    "output": "dist"
  },
  "files": [
    "out/**/*"
  ],
  "win": {
    "target": ["nsis"]
  },
  "mac": {
    "target": ["dmg"],
    "category": "public.app-category.business"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "category": "Office"
  }
}



#Códigos de barra y lector
jsbarcode (y @types/jsbarcode): Genera códigos de barra estándar (Code 128 o EAN-13) en elementos <canvas> o <svg> para visualizarlos e imprimirlos.

#Lógica para el lector: No requiere librerías externas. Los lectores láser USB actúan como teclados físicos (HID). Se maneja mediante un hook en React que escucha eventos keydown en una ventana corta de tiempo (un humano teclea en ~100ms por tecla, un láser envía toda la secuencia en menos de 30ms y remata con un Enter).

#Impresión de etiquetas y tickets
webContents.print() (API nativa de Electron): Permite imprimir etiquetas o tickets de manera silenciosa (silent: true) a la impresora térmica o de oficina seleccionada sin mostrar el diálogo del sistema operativo.
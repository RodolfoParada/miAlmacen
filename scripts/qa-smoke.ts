import { app } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { existsSync, rmSync, statSync } from 'fs'
import { cerrarDb, respaldar, rutaDb } from '../src/main/db'
import * as productos from '../src/main/db/productos.repo'
import * as ventas from '../src/main/db/ventas.repo'

const dbPath = join(tmpdir(), `mialmacen-qa-${Date.now()}.db`)
const backupPath = join(tmpdir(), `mialmacen-backup-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

app.whenReady().then(async () => {
  const salida: Record<string, unknown> = {}

  try {
    // 1. Código duplicado
    productos.crear({
      codigo: 'DUP-1',
      nombre: 'Duplicado',
      precio: 100,
      stock: 1,
      unidad: 'UNIDAD',
      accesoRapido: null
    })
    let errorDuplicado = ''
    try {
      productos.crear({
        codigo: 'DUP-1',
        nombre: 'Otro',
        precio: 200,
        stock: 1,
        unidad: 'UNIDAD',
        accesoRapido: null
      })
    } catch (e) {
      errorDuplicado = (e as Error).message
    }
    salida.codigoDuplicado = /UNIQUE/i.test(errorDuplicado) ? 'rechazado' : errorDuplicado

    // 2. Venta con stock 0
    const sinStock = productos.crear({
      codigo: 'CERO-1',
      nombre: 'Sin stock',
      precio: 500,
      stock: 0,
      unidad: 'UNIDAD',
      accesoRapido: null
    })
    let errorStock = ''
    try {
      ventas.procesarVenta([{ productoId: sinStock.id, cantidad: 1 }])
    } catch (e) {
      errorStock = (e as Error).message
    }
    salida.stockCero = errorStock
    salida.stockCeroIntacto = productos.buscarPorId(sinStock.id)?.stock
    salida.ventasTrasFallo = ventas.listarVentas().length

    // 3. Respaldo de la base de datos
    salida.rutaDb = rutaDb()
    await respaldar(backupPath)
    salida.backupExiste = existsSync(backupPath)
    salida.backupBytes = existsSync(backupPath) ? statSync(backupPath).size : 0
  } catch (e) {
    salida.error = (e as Error).message
  }

  console.log('QA_RESULT', JSON.stringify(salida))
  cerrarDb()
  for (const ruta of [dbPath, backupPath]) {
    for (const sufijo of ['', '-wal', '-shm']) {
      try {
        rmSync(ruta + sufijo)
      } catch {
        /* ignore */
      }
    }
  }
  app.exit(0)
})

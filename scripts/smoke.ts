import { app } from 'electron'
import { rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as productos from '../src/main/db/productos.repo'
import * as ventas from '../src/main/db/ventas.repo'

const dbPath = join(tmpdir(), `mialmacen-smoke-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED', e)
  app.exit(1)
})

app.whenReady().then(() => {
  try {
    const p1 = productos.crear({
      codigo: 'P-001',
      nombre: 'Coca Cola',
      precio: 1500,
      stock: 10,
      unidad: 'UNIDAD',
      accesoRapido: null
    })
    const p2 = productos.crear({
      codigo: 'P-002',
      nombre: 'Pan',
      precio: 900,
      stock: 3,
      unidad: 'UNIDAD',
      accesoRapido: null
    })

    console.log('BUSCAR', JSON.stringify(productos.buscarPorCodigo('P-001')))

    const r = ventas.procesarVenta([
      { productoId: p1.id, cantidad: 2 },
      { productoId: p2.id, cantidad: 1 }
    ])
    console.log('VENTA', JSON.stringify(r))
    console.log('STOCK_P1', productos.buscarPorId(p1.id)?.stock)
    console.log('STOCK_P2', productos.buscarPorId(p2.id)?.stock)

    let fallo = 'sin-error'
    try {
      ventas.procesarVenta([{ productoId: p2.id, cantidad: 99 }])
    } catch (e) {
      fallo = (e as Error).message
    }
    console.log('ROLLBACK', fallo)
    console.log('STOCK_P2_TRAS_FALLO', productos.buscarPorId(p2.id)?.stock)
    console.log('HISTORIAL', JSON.stringify(ventas.listarVentas()))
  } catch (e) {
    console.error('ERROR', e)
    app.exit(1)
    return
  }

  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})

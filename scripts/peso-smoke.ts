import { app } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { cerrarDb } from '../src/main/db'
import * as productos from '../src/main/db/productos.repo'
import * as producciones from '../src/main/db/producciones.repo'
import * as ventas from '../src/main/db/ventas.repo'

const dbPath = join(tmpdir(), `mialmacen-peso-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

app.whenReady().then(() => {
  const salida: Record<string, unknown> = {}

  try {
    const pan = productos.crear({
      codigo: '101',
      nombre: 'Pan Marraqueta',
      precio: 180000,
      stock: 0,
      unidad: 'PESO',
      accesoRapido: 'F2'
    })
    salida.creado = { unidad: pan.unidad, precio: pan.precio, accesoRapido: pan.accesoRapido }

    const prod = producciones.registrar(pan.id, 12000)
    salida.produccion = { gramos: prod.gramos, stock: productos.buscarPorId(pan.id)?.stock }

    // venta por peso: 450 g a $1800/kg => $810,00 => 81000 centavos
    const venta1 = ventas.procesarVenta([{ productoId: pan.id, cantidad: 450 }])
    const detalle1 = ventas.obtenerVenta(venta1.ventaId)?.items[0]
    salida.ventaPeso = {
      subtotal: detalle1?.subtotal,
      unidad: detalle1?.unidad,
      stockRestante: productos.buscarPorId(pan.id)?.stock
    }

    // venta por monto: cliente pide $1000 => gramos = round(100000*1000/180000) = 556 g
    const gramos = Math.round((100000 * 1000) / 180000)
    const venta2 = ventas.procesarVenta([{ productoId: pan.id, cantidad: gramos }])
    salida.ventaMonto = {
      gramos,
      subtotal: ventas.obtenerVenta(venta2.ventaId)?.items[0].subtotal
    }

    // unidad normal sigue funcionando
    const gaseosa = productos.crear({
      codigo: 'G-1',
      nombre: 'Gaseosa',
      precio: 150000,
      stock: 5,
      unidad: 'UNIDAD',
      accesoRapido: null
    })
    const venta3 = ventas.procesarVenta([{ productoId: gaseosa.id, cantidad: 2 }])
    salida.ventaUnidad = {
      subtotal: ventas.obtenerVenta(venta3.ventaId)?.items[0].subtotal,
      stock: productos.buscarPorId(gaseosa.id)?.stock
    }

    salida.historialProd = producciones.listar().length
  } catch (e) {
    salida.error = (e as Error).message
  }

  console.log('PESO_RESULT', JSON.stringify(salida))
  cerrarDb()
  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})

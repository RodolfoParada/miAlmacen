import type {
  ItemVentaDetalle,
  ItemVentaInput,
  ResultadoVenta,
  Unidad,
  Venta
} from '@shared/types'
import { subtotalLinea } from '@shared/money'
import { getDb } from './index'

const SQL_DETALLE = `
  SELECT d.id AS id,
         d.venta_id AS ventaId,
         d.producto_id AS productoId,
         p.codigo AS codigo,
         p.nombre AS nombre,
         d.unidad AS unidad,
         d.cantidad AS cantidad,
         d.precio_unitario AS precioUnitario,
         d.subtotal AS subtotal
  FROM ventas_detalle d
  JOIN productos p ON p.id = d.producto_id
  WHERE d.venta_id = ?
  ORDER BY d.id
`

export function procesarVenta(items: ItemVentaInput[]): ResultadoVenta {
  if (items.length === 0) {
    throw new Error('La venta no tiene productos')
  }

  const db = getDb()

  const transaccion = db.transaction((lineas: ItemVentaInput[]) => {
    const leerProducto = db.prepare('SELECT precio, stock, unidad FROM productos WHERE id = ?')
    const insertarVenta = db.prepare('INSERT INTO ventas (total) VALUES (?)')
    const descontarStock = db.prepare('UPDATE productos SET stock = stock - ? WHERE id = ?')
    const insertarDetalle = db.prepare(
      `INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal, unidad)
       VALUES (?, ?, ?, ?, ?, ?)`
    )

    const datos = new Map<number, { precio: number; unidad: Unidad }>()
    let total = 0

    for (const linea of lineas) {
      if (linea.cantidad <= 0) {
        throw new Error('La cantidad debe ser mayor a cero')
      }
      const producto = leerProducto.get(linea.productoId) as
        | { precio: number; stock: number; unidad: Unidad }
        | undefined
      if (!producto) {
        throw new Error(`Producto ${linea.productoId} no encontrado`)
      }
      if (producto.stock < linea.cantidad) {
        const detalle =
          producto.unidad === 'PESO'
            ? `${(linea.cantidad / 1000).toFixed(3)} kg (disponible: ${(producto.stock / 1000).toFixed(3)} kg)`
            : `disponible: ${producto.stock}`
        throw new Error(`Stock insuficiente para el producto ${linea.productoId} (${detalle})`)
      }
      datos.set(linea.productoId, { precio: producto.precio, unidad: producto.unidad })
      total += subtotalLinea(producto.unidad, producto.precio, linea.cantidad)
    }

    const venta = insertarVenta.run(total)
    const ventaId = Number(venta.lastInsertRowid)

    for (const linea of lineas) {
      const { precio, unidad } = datos.get(linea.productoId) as {
        precio: number
        unidad: Unidad
      }
      descontarStock.run(linea.cantidad, linea.productoId)
      insertarDetalle.run(
        ventaId,
        linea.productoId,
        linea.cantidad,
        precio,
        subtotalLinea(unidad, precio, linea.cantidad),
        unidad
      )
    }

    return { success: true as const, ventaId }
  })

  return transaccion(items)
}

export function listarVentas(): Venta[] {
  const db = getDb()
  const ventas = db.prepare('SELECT id, fecha, total FROM ventas ORDER BY id DESC').all() as Omit<
    Venta,
    'items'
  >[]
  const leerDetalle = db.prepare(SQL_DETALLE)

  return ventas.map((venta) => ({
    ...venta,
    items: leerDetalle.all(venta.id) as ItemVentaDetalle[]
  }))
}

export function obtenerVenta(id: number): Venta | undefined {
  const db = getDb()
  const venta = db.prepare('SELECT id, fecha, total FROM ventas WHERE id = ?').get(id) as
    | Omit<Venta, 'items'>
    | undefined
  if (!venta) {
    return undefined
  }
  const items = db.prepare(SQL_DETALLE).all(id) as ItemVentaDetalle[]
  return { ...venta, items }
}

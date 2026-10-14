import type { ActualizacionProducto, NuevoProducto, Producto } from '@shared/types'
import { getDb } from './index'

const CAMPOS = 'id, codigo, nombre, precio, stock, unidad, acceso_rapido AS accesoRapido'

export function listar(): Producto[] {
  return getDb().prepare(`SELECT ${CAMPOS} FROM productos ORDER BY nombre`).all() as Producto[]
}

export function buscarPorCodigo(codigo: string): Producto | undefined {
  return getDb()
    .prepare(`SELECT ${CAMPOS} FROM productos WHERE codigo = ?`)
    .get(codigo) as Producto | undefined
}

export function buscarPorId(id: number): Producto | undefined {
  return getDb()
    .prepare(`SELECT ${CAMPOS} FROM productos WHERE id = ?`)
    .get(id) as Producto | undefined
}

export function crear(producto: NuevoProducto): Producto {
  const db = getDb()
  const info = db
    .prepare(
      `INSERT INTO productos (codigo, nombre, precio, stock, unidad, acceso_rapido)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      producto.codigo,
      producto.nombre,
      producto.precio,
      producto.stock,
      producto.unidad,
      producto.accesoRapido
    )

  return db.prepare(`SELECT ${CAMPOS} FROM productos WHERE id = ?`).get(
    Number(info.lastInsertRowid)
  ) as Producto
}

export function actualizar(producto: ActualizacionProducto): Producto {
  const db = getDb()
  const actual = buscarPorId(producto.id)
  if (!actual) {
    throw new Error(`Producto ${producto.id} no encontrado`)
  }

  const fusionado: Producto = { ...actual, ...producto }
  db.prepare(
    `UPDATE productos SET codigo = ?, nombre = ?, precio = ?, stock = ?, unidad = ?, acceso_rapido = ?
     WHERE id = ?`
  ).run(
    fusionado.codigo,
    fusionado.nombre,
    fusionado.precio,
    fusionado.stock,
    fusionado.unidad,
    fusionado.accesoRapido,
    fusionado.id
  )

  return fusionado
}

export function eliminar(id: number): void {
  getDb().prepare('DELETE FROM productos WHERE id = ?').run(id)
}

export function ajustarStock(id: number, delta: number): Producto {
  const db = getDb()
  const info = db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?').run(delta, id)
  if (info.changes === 0) {
    throw new Error(`Producto ${id} no encontrado`)
  }
  return buscarPorId(id) as Producto
}

export function generarCodigo(): string {
  const fila = getDb()
    .prepare(
      "SELECT MAX(CAST(SUBSTR(codigo, 3) AS INTEGER)) AS maximo FROM productos WHERE codigo LIKE 'P-%'"
    )
    .get() as { maximo: number | null }
  const siguiente = (fila.maximo ?? 0) + 1
  return `P-${String(siguiente).padStart(6, '0')}`
}

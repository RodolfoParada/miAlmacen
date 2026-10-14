import type { Produccion } from '@shared/types'
import { getDb } from './index'

const SQL = `
  SELECT pr.id AS id,
         pr.producto_id AS productoId,
         p.codigo AS codigo,
         p.nombre AS nombre,
         pr.gramos AS gramos,
         pr.fecha AS fecha
  FROM producciones pr
  JOIN productos p ON p.id = pr.producto_id
`

export function registrar(productoId: number, gramos: number): Produccion {
  if (gramos <= 0) {
    throw new Error('La cantidad producida debe ser mayor a cero')
  }

  const db = getDb()
  const id = db.transaction(() => {
    const producto = db.prepare('SELECT id FROM productos WHERE id = ?').get(productoId)
    if (!producto) {
      throw new Error(`Producto ${productoId} no encontrado`)
    }
    db.prepare('UPDATE productos SET stock = stock + ? WHERE id = ?').run(gramos, productoId)
    const info = db
      .prepare('INSERT INTO producciones (producto_id, gramos) VALUES (?, ?)')
      .run(productoId, gramos)
    return Number(info.lastInsertRowid)
  })()

  return db.prepare(`${SQL} WHERE pr.id = ?`).get(id) as Produccion
}

export function listar(limite = 100): Produccion[] {
  return getDb().prepare(`${SQL} ORDER BY pr.id DESC LIMIT ?`).all(limite) as Produccion[]
}

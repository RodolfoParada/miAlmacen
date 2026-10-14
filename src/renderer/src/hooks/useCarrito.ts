import { useCallback, useMemo, useState } from 'react'
import type { ItemVentaInput, Producto } from '@shared/types'
import { subtotalLinea } from '@shared/money'

export interface CarritoItem {
  producto: Producto
  cantidad: number
}

export interface Carrito {
  items: CarritoItem[]
  total: number
  cantidadTotal: number
  agregar: (producto: Producto, cantidad?: number) => void
  cambiarCantidad: (productoId: number, cantidad: number) => void
  quitar: (productoId: number) => void
  limpiar: () => void
  aItemsVenta: () => ItemVentaInput[]
}

export function useCarrito(): Carrito {
  const [items, setItems] = useState<CarritoItem[]>([])

  const agregar = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const indice = prev.findIndex((item) => item.producto.id === producto.id)
      if (indice === -1) {
        return [...prev, { producto, cantidad }]
      }
      const copia = [...prev]
      copia[indice] = { ...copia[indice], cantidad: copia[indice].cantidad + cantidad }
      return copia
    })
  }, [])

  const cambiarCantidad = useCallback((productoId: number, cantidad: number) => {
    setItems((prev) =>
      prev.flatMap((item) =>
        item.producto.id === productoId
          ? cantidad <= 0
            ? []
            : [{ ...item, cantidad }]
          : [item]
      )
    )
  }, [])

  const quitar = useCallback((productoId: number) => {
    setItems((prev) => prev.filter((item) => item.producto.id !== productoId))
  }, [])

  const limpiar = useCallback(() => setItems([]), [])

  const total = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + subtotalLinea(item.producto.unidad, item.producto.precio, item.cantidad),
        0
      ),
    [items]
  )

  const cantidadTotal = useMemo(() => items.length, [items])

  const aItemsVenta = useCallback(
    (): ItemVentaInput[] =>
      items.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad })),
    [items]
  )

  return { items, total, cantidadTotal, agregar, cambiarCantidad, quitar, limpiar, aItemsVenta }
}

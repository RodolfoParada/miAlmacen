export type Unidad = 'UNIDAD' | 'PESO'

export interface Producto {
  id: number
  codigo: string
  nombre: string
  precio: number
  stock: number
  unidad: Unidad
  accesoRapido: string | null
}

export type NuevoProducto = Omit<Producto, 'id'>
export type ActualizacionProducto = Partial<Omit<Producto, 'id'>> & { id: number }

export interface ItemVentaInput {
  productoId: number
  cantidad: number
}

export interface ItemVentaDetalle {
  id: number
  ventaId: number
  productoId: number
  codigo: string
  nombre: string
  unidad: Unidad
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface Venta {
  id: number
  fecha: string
  total: number
  items: ItemVentaDetalle[]
}

export interface Produccion {
  id: number
  productoId: number
  codigo: string
  nombre: string
  gramos: number
  fecha: string
}

export interface ResultadoVenta {
  success: true
  ventaId: number
}

export interface DatosEtiqueta {
  codigo: string
  nombre: string
  precio?: number
}

export interface DatosTicket {
  ventaId: number
  fecha: string
  items: ItemVentaDetalle[]
  total: number
}

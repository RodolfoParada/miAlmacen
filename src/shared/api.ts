import type {
  ItemVentaInput,
  Produccion,
  Producto,
  ResultadoVenta,
  Unidad,
  Venta
} from './types'

export interface GuardarProductoInput {
  id?: number
  codigo: string
  nombre: string
  precio: number
  stock: number
  unidad?: Unidad
  accesoRapido?: string | null
}

export interface Impresora {
  name: string
  displayName: string
  description: string
}

export interface OpcionesImpresion {
  deviceName?: string
  silent?: boolean
  landscape?: boolean
  copies?: number
}

export interface ResultadoImpresion {
  ok: boolean
  error?: string
}

export interface ResultadoRespaldo {
  ok: boolean
  ruta?: string
  cancelado?: boolean
  error?: string
}

export interface VentanaApi {
  minimizar(): void
  maximizar(): void
  cerrar(): void
  estaMaximizada(): Promise<boolean>
  onCambioMaximizado(callback: (maximizado: boolean) => void): () => void
}

export interface Api {
  ping(): Promise<string>

  listarProductos(): Promise<Producto[]>
  buscarProducto(codigo: string): Promise<Producto | undefined>
  buscarProductoPorId(id: number): Promise<Producto | undefined>
  guardarProducto(datos: GuardarProductoInput): Promise<Producto>
  eliminarProducto(id: number): Promise<void>
  ajustarStock(id: number, delta: number): Promise<Producto>
  generarCodigo(): Promise<string>

  ejecutarVenta(items: ItemVentaInput[]): Promise<ResultadoVenta>
  historialVentas(): Promise<Venta[]>
  obtenerVenta(id: number): Promise<Venta | undefined>

  registrarProduccion(productoId: number, gramos: number): Promise<Produccion>
  historialProducciones(): Promise<Produccion[]>

  listarImpresoras(): Promise<Impresora[]>
  imprimirEtiqueta(html: string, opciones?: OpcionesImpresion): Promise<ResultadoImpresion>
  imprimirTicket(html: string, opciones?: OpcionesImpresion): Promise<ResultadoImpresion>

  rutaBaseDeDatos(): Promise<string>
  respaldarBaseDeDatos(): Promise<ResultadoRespaldo>

  ventana: VentanaApi
}

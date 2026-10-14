import { contextBridge, ipcRenderer } from 'electron'
import type {
  Api,
  GuardarProductoInput,
  OpcionesImpresion
} from '@shared/api'
import type { ItemVentaInput } from '@shared/types'

export const api: Api = {
  ping: () => ipcRenderer.invoke('ping'),

  listarProductos: () => ipcRenderer.invoke('db:listar-productos'),
  buscarProducto: (codigo: string) => ipcRenderer.invoke('db:buscar-producto', codigo),
  buscarProductoPorId: (id: number) => ipcRenderer.invoke('db:buscar-producto-id', id),
  guardarProducto: (datos: GuardarProductoInput) => ipcRenderer.invoke('db:guardar-producto', datos),
  eliminarProducto: (id: number) => ipcRenderer.invoke('db:eliminar-producto', id),
  ajustarStock: (id: number, delta: number) => ipcRenderer.invoke('db:ajustar-stock', id, delta),
  generarCodigo: () => ipcRenderer.invoke('db:generar-codigo'),

  ejecutarVenta: (items: ItemVentaInput[]) => ipcRenderer.invoke('db:ejecutar-venta', items),
  historialVentas: () => ipcRenderer.invoke('db:historial-ventas'),
  obtenerVenta: (id: number) => ipcRenderer.invoke('db:obtener-venta', id),

  registrarProduccion: (productoId: number, gramos: number) =>
    ipcRenderer.invoke('db:registrar-produccion', productoId, gramos),
  historialProducciones: () => ipcRenderer.invoke('db:historial-producciones'),

  listarImpresoras: () => ipcRenderer.invoke('printer:listar-impresoras'),
  imprimirEtiqueta: (html: string, opciones?: OpcionesImpresion) =>
    ipcRenderer.invoke('printer:imprimir-etiqueta', html, opciones),
  imprimirTicket: (html: string, opciones?: OpcionesImpresion) =>
    ipcRenderer.invoke('printer:imprimir-ticket', html, opciones),

  rutaBaseDeDatos: () => ipcRenderer.invoke('db:ruta'),
  respaldarBaseDeDatos: () => ipcRenderer.invoke('db:respaldar'),

  ventana: {
    minimizar: () => ipcRenderer.send('ventana:minimizar'),
    maximizar: () => ipcRenderer.send('ventana:maximizar'),
    cerrar: () => ipcRenderer.send('ventana:cerrar'),
    estaMaximizada: () => ipcRenderer.invoke('ventana:esta-maximizada'),
    onCambioMaximizado: (callback: (maximizado: boolean) => void) => {
      const listener = (_evento: Electron.IpcRendererEvent, maximizado: boolean): void =>
        callback(maximizado)
      ipcRenderer.on('ventana:maximizado', listener)
      return () => ipcRenderer.removeListener('ventana:maximizado', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (definido en index.d.ts)
  window.api = api
}

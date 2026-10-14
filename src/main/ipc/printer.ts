import { ipcMain } from 'electron'
import type { OpcionesImpresion } from '@shared/api'
import { imprimirHtml, listarImpresoras } from '../printer'

export function registrarPrinterIpc(): void {
  ipcMain.handle('printer:listar-impresoras', () => listarImpresoras())

  ipcMain.handle(
    'printer:imprimir-etiqueta',
    (_evento, html: string, opciones?: OpcionesImpresion) => imprimirHtml(html, opciones)
  )

  ipcMain.handle(
    'printer:imprimir-ticket',
    (_evento, html: string, opciones?: OpcionesImpresion) => imprimirHtml(html, opciones)
  )
}

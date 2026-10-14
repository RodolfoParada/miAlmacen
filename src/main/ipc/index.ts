import { ipcMain } from 'electron'
import { registrarPrinterIpc } from './printer'
import { registrarProduccionesIpc } from './producciones'
import { registrarProductosIpc } from './productos'
import { registrarSistemaIpc } from './sistema'
import { registrarVentanaIpc } from './ventana'
import { registrarVentasIpc } from './ventas'

export function registrarIpc(): void {
  ipcMain.handle('ping', () => 'pong')

  registrarProductosIpc()
  registrarVentasIpc()
  registrarProduccionesIpc()
  registrarPrinterIpc()
  registrarSistemaIpc()
  registrarVentanaIpc()
}

import { ipcMain } from 'electron'
import type { ItemVentaInput } from '@shared/types'
import * as repo from '../db/ventas.repo'

export function registrarVentasIpc(): void {
  ipcMain.handle('db:ejecutar-venta', (_evento, items: ItemVentaInput[]) => repo.procesarVenta(items))

  ipcMain.handle('db:historial-ventas', () => repo.listarVentas())

  ipcMain.handle('db:obtener-venta', (_evento, id: number) => repo.obtenerVenta(id))
}

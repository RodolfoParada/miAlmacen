import { ipcMain } from 'electron'
import * as repo from '../db/producciones.repo'

export function registrarProduccionesIpc(): void {
  ipcMain.handle('db:registrar-produccion', (_evento, productoId: number, gramos: number) =>
    repo.registrar(productoId, gramos)
  )

  ipcMain.handle('db:historial-producciones', () => repo.listar())
}

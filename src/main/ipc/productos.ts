import { ipcMain } from 'electron'
import type { GuardarProductoInput } from '@shared/api'
import * as repo from '../db/productos.repo'

export function registrarProductosIpc(): void {
  ipcMain.handle('db:listar-productos', () => repo.listar())

  ipcMain.handle('db:buscar-producto', (_evento, codigo: string) => repo.buscarPorCodigo(codigo))

  ipcMain.handle('db:buscar-producto-id', (_evento, id: number) => repo.buscarPorId(id))

  ipcMain.handle('db:guardar-producto', (_evento, datos: GuardarProductoInput) => {
    if (datos.id != null) {
      return repo.actualizar({
        ...datos,
        id: datos.id,
        unidad: datos.unidad ?? 'UNIDAD',
        accesoRapido: datos.accesoRapido ?? null
      })
    }
    return repo.crear({
      codigo: datos.codigo,
      nombre: datos.nombre,
      precio: datos.precio,
      stock: datos.stock,
      unidad: datos.unidad ?? 'UNIDAD',
      accesoRapido: datos.accesoRapido ?? null
    })
  })

  ipcMain.handle('db:eliminar-producto', (_evento, id: number) => {
    repo.eliminar(id)
  })

  ipcMain.handle('db:ajustar-stock', (_evento, id: number, delta: number) =>
    repo.ajustarStock(id, delta)
  )

  ipcMain.handle('db:generar-codigo', () => repo.generarCodigo())
}

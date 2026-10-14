import { dialog, ipcMain } from 'electron'
import { rutaDb, respaldar } from '../db'

export function registrarSistemaIpc(): void {
  ipcMain.handle('db:ruta', () => rutaDb())

  ipcMain.handle('db:respaldar', async () => {
    const fecha = new Date().toISOString().slice(0, 10)
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar respaldo de la base de datos',
      defaultPath: `pos_almacen-${fecha}.db`,
      filters: [{ name: 'SQLite', extensions: ['db'] }]
    })

    if (canceled || !filePath) {
      return { ok: false, cancelado: true }
    }

    try {
      await respaldar(filePath)
      return { ok: true, ruta: filePath }
    } catch (e) {
      return { ok: false, error: (e as Error).message }
    }
  })
}

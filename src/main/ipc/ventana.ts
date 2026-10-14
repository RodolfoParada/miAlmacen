import { app, BrowserWindow, ipcMain } from 'electron'

function notificarEstado(ventana: BrowserWindow): void {
  if (ventana.isDestroyed()) return
  ventana.webContents.send('ventana:maximizado', ventana.isMaximized())
}

export function registrarVentanaIpc(): void {
  app.on('browser-window-created', (_evento, ventana) => {
    ventana.on('maximize', () => notificarEstado(ventana))
    ventana.on('unmaximize', () => notificarEstado(ventana))
  })

  ipcMain.on('ventana:minimizar', (evento) => {
    BrowserWindow.fromWebContents(evento.sender)?.minimize()
  })

  ipcMain.on('ventana:maximizar', (evento) => {
    const ventana = BrowserWindow.fromWebContents(evento.sender)
    if (!ventana) return
    if (ventana.isMaximized()) {
      ventana.unmaximize()
    } else {
      ventana.maximize()
    }
  })

  ipcMain.on('ventana:cerrar', (evento) => {
    BrowserWindow.fromWebContents(evento.sender)?.close()
  })

  ipcMain.handle(
    'ventana:esta-maximizada',
    (evento) => BrowserWindow.fromWebContents(evento.sender)?.isMaximized() ?? false
  )
}

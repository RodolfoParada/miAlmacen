import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-ipc-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')

const pagina = `<!doctype html><html><body></body></html>`

const script = `
(async () => {
  const guardado = await window.api.guardarProducto({ codigo: 'X-1', nombre: 'Test', precio: 100, stock: 5 })
  const buscado = await window.api.buscarProducto('X-1')
  const venta = await window.api.ejecutarVenta([{ productoId: guardado.id, cantidad: 2 }])
  const despues = await window.api.buscarProductoPorId(guardado.id)
  const historial = await window.api.historialVentas()
  const pong = await window.api.ping()
  return { buscado, venta, stockTrasVenta: despues.stock, ventas: historial.length, pong }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(pagina))
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('IPC_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('IPC_ERROR', e)
    app.exit(1)
    return
  }

  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})

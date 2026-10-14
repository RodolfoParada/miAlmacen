import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-win-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    show: true,
    frame: false,
    webPreferences: { preload, sandbox: false }
  })

  const salida: Record<string, unknown> = {}
  try {
    await win.loadFile(indexHtml)
    await esperar(300)

    salida.controles = await win.webContents.executeJavaScript(
      `[...document.querySelectorAll('.ventana-controles button')].map((b) => b.getAttribute('aria-label'))`
    )

    await win.webContents.executeJavaScript(
      `document.querySelector('.ventana-controles button[aria-label="Maximizar"]').click()`
    )
    await esperar(500)
    salida.trasMaximizar = win.isMaximized()
    salida.etiquetaRestaurar = await win.webContents.executeJavaScript(
      `document.querySelector('.ventana-controles button:nth-child(2)').getAttribute('aria-label')`
    )

    await win.webContents.executeJavaScript(
      `document.querySelector('.ventana-controles button[aria-label="Restaurar"]').click()`
    )
    await esperar(500)
    salida.trasRestaurar = win.isMaximized()
  } catch (e) {
    salida.error = (e as Error).message
  }

  console.log('WIN_RESULT', JSON.stringify(salida))

  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})

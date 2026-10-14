import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-res-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  location.hash = '#/etiquetas'
  await esperar(500)
  const info = (el) => (el ? getComputedStyle(el) : null)
  const app = document.querySelector('.app')
  const sidebar = document.querySelector('.sidebar')
  const grid2 = document.querySelector('.grid-2')
  const pagina = document.querySelector('.pagina')
  return {
    viewport: [window.innerWidth, window.innerHeight],
    appCols: info(app).gridTemplateColumns,
    sidebarDir: info(sidebar).flexDirection,
    grid2Cols: info(grid2).gridTemplateColumns.split(' ').length,
    paginaAncho: Math.round(pagina.getBoundingClientRect().width),
    overflowX: document.querySelector('.contenido').scrollWidth > document.querySelector('.contenido').clientWidth
  }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const ancho = Number(process.env.RES_W) || 1440
  const alto = Number(process.env.RES_H) || 900
  const win = new BrowserWindow({
    width: ancho,
    height: alto,
    show: false,
    webPreferences: { preload, sandbox: false }
  })
  let resultado: unknown
  try {
    await win.loadFile(indexHtml)
    resultado = await win.webContents.executeJavaScript(script)
  } catch (e) {
    resultado = { error: (e as Error).message }
  }

  console.log('RES_RESULT', JSON.stringify(resultado))

  for (const sufijo of ['', '-wal', '-shm']) {
    try {
      rmSync(dbPath + sufijo)
    } catch {
      /* ignore */
    }
  }
  app.exit(0)
})

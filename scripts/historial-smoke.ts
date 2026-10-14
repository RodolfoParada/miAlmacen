import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-hist-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  const prod = await window.api.guardarProducto({ codigo: 'H-1', nombre: 'Historial', precio: 1000, stock: 10 })
  await window.api.ejecutarVenta([{ productoId: prod.id, cantidad: 3 }])

  location.hash = '#/historial'
  await esperar(500)

  const filasVentas = [...document.querySelectorAll('.panel:first-child .tabla tbody tr')].length
  const detalle = [...document.querySelectorAll('.grid-2 .panel:nth-child(2) .tabla tbody tr')]
    .map((tr) => [...tr.children].map((td) => td.textContent.trim()))
  const totalDetalle = document.querySelector('.total-row span:last-child')?.textContent

  const boton = [...document.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === 'Reimprimir ticket'
  )
  boton.click()
  await esperar(600)
  const mensaje = document.querySelector('.mensaje')?.textContent

  return { filasVentas, detalle, totalDetalle, mensaje }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('HIST_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('HIST_ERROR', e)
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

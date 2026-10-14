import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-etq-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  const prod = await window.api.guardarProducto({ codigo: 'ETQ-1', nombre: 'Etiqueta', precio: 1250, stock: 5 })

  location.hash = '#/etiquetas'
  await esperar(400)

  const sel = document.querySelector('select')
  Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sel, String(prod.id))
  sel.dispatchEvent(new Event('change', { bubbles: true }))
  await esperar(400)

  const nombre = document.querySelector('.etiqueta-preview .nombre')?.textContent
  const svg = document.querySelector('.etiqueta-preview svg')
  const barras = svg ? svg.innerHTML.length : 0
  const impresoras = (await window.api.listarImpresoras()).length

  const boton = [...document.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === 'Imprimir etiqueta'
  )
  boton.click()
  await esperar(700)
  const mensaje = document.querySelector('.mensaje')?.textContent

  return { nombre, barras, impresoras, mensaje }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('ETQ_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('ETQ_ERROR', e)
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

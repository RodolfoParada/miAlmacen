import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-inv-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const filas = () =>
    [...document.querySelectorAll('.tabla tbody tr')].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim())
    )

  location.hash = '#/inventario'
  await esperar(400)

  let inputs = [...document.querySelectorAll('.grid-form input')]
  setVal(inputs[0], 'UI-001')
  setVal(inputs[1], 'Producto UI')
  setVal(inputs[2], '1234.5')
  setVal(inputs[3], '7')
  await esperar(60)
  document.querySelector('form button[type=submit]').click()
  await esperar(500)
  const trasCrear = filas()

  const botonTexto = (texto) =>
    [...document.querySelectorAll('.tabla tbody button')].find(
      (b) => b.textContent.trim() === texto
    )

  botonTexto('Editar').click()
  await esperar(250)
  inputs = [...document.querySelectorAll('.grid-form input')]
  setVal(inputs[3], '3')
  await esperar(60)
  document.querySelector('form button[type=submit]').click()
  await esperar(500)
  const trasEditar = filas()

  window.confirm = () => true
  botonTexto('Eliminar').click()
  await esperar(500)
  const trasEliminar = filas()

  return { trasCrear, trasEditar, trasEliminar }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('INV_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('INV_ERROR', e)
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

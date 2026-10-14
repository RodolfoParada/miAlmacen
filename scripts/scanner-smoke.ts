import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { rmSync } from 'fs'
import { registrarIpc } from '../src/main/ipc'

const dbPath = join(tmpdir(), `mialmacen-scan-${Date.now()}.db`)
process.env.MIALMACEN_DB_PATH = dbPath

const preload = join(process.cwd(), 'out/preload/index.js')
const indexHtml = join(process.cwd(), 'out/renderer/index.html')

const script = `
(async () => {
  const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
  await window.api.guardarProducto({ codigo: 'SCAN-1', nombre: 'Escaneado', precio: 200, stock: 9 })

  location.hash = '#/inventario'
  await esperar(400)
  document.activeElement && document.activeElement.blur()

  const tecla = (k) =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))

  // ráfaga de un escáner (~0ms entre teclas) + Enter
  ;['S','C','A','N','-','1'].forEach(tecla)
  tecla('Enter')
  await esperar(300)

  const codigoEnForm = document.querySelector('.grid-form input')?.value
  const mensaje = document.querySelector('.mensaje')?.textContent

  // código nuevo → abre formulario pre-cargado con foco en Nombre
  ;['N','U','E','V','O','-','9'].forEach(tecla)
  tecla('Enter')
  await esperar(300)
  const cuadro = document.querySelectorAll('.grid-form .campo')
  const codigoNuevo = cuadro[0].querySelector('input')?.value
  const focoNombre = document.activeElement?.closest('.campo') === cuadro[1]
  const badge = document.querySelector('.panel-header .badge')?.textContent

  // el humano completa los demás campos y guarda
  const setVal = (el, v) => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  setVal(cuadro[1].querySelector('input'), 'Producto Escaneado')
  setVal(cuadro[3].querySelector('input'), '1990')
  setVal(cuadro[4].querySelector('input'), '12')
  document.querySelector('form.panel').requestSubmit()
  await esperar(400)

  const creado = await window.api.buscarProducto('NUEVO-9')

  return { codigoEnForm, mensaje, codigoNuevo, focoNombre, badge, creado }
})()
`

app.whenReady().then(async () => {
  registrarIpc()
  const win = new BrowserWindow({ show: false, webPreferences: { preload, sandbox: false } })

  try {
    await win.loadFile(indexHtml)
    const resultado = await win.webContents.executeJavaScript(script)
    console.log('SCAN_RESULT', JSON.stringify(resultado))
  } catch (e) {
    console.error('SCAN_ERROR', e)
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
